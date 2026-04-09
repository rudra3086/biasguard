import { NextResponse } from 'next/server'

interface UploadResponse {
  status: string
  file_id: string
  filename: string
  dataset_shape: {
    rows: number
    columns: number
  }
  column_info: {
    column_names: string[]
    data_types: Record<string, string>
    missing_values: Record<string, number>
    unique_counts: Record<string, number>
  }
  message: string
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    // Forward to FastAPI backend
    const formDataToSend = new FormData()
    formDataToSend.append('file', file)

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`)
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data: UploadResponse = await response.json()

      // Transform response for frontend compatibility
      return NextResponse.json({
        status: 'success',
        file_id: data.file_id,
        filename: data.filename,
        dataset_info: data.column_info,
        dataset_shape: data.dataset_shape,
        message: data.message,
      })
    } catch (backendError) {
      const errorMsg = backendError instanceof Error ? backendError.message : 'Unknown error'
      console.error('Backend communication error:', errorMsg)
      
      // Provide helpful error message
      const isConnectionError = errorMsg.includes('fetch') || errorMsg.includes('ECONNREFUSED')
      return NextResponse.json(
        {
          error: isConnectionError 
            ? `Cannot connect to backend at ${backendUrl}. Make sure the FastAPI backend is running.`
            : `Backend error: ${errorMsg}`,
          message: `Backend URL: ${backendUrl}. Check BACKEND_URL environment variable and backend status.`,
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
