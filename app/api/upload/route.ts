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
        const e = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(e.detail || 'Upload failed')
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
      console.error('Backend communication error:', backendError)
      return NextResponse.json(
        {
          error: `Backend error: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`,
          message: 'Make sure the FastAPI backend is running on port 8000',
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
