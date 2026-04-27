import { NextResponse } from 'next/server'

interface AnalyzeRequest {
  file_id: string
  target_column: string
  task_type?: string
  sensitive_features?: string[]
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json()

    if (!body.file_id || !body.target_column) {
      return NextResponse.json(
        { error: 'Missing required fields: file_id and target_column' },
        { status: 400 }
      )
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: body.file_id,
          target_column: body.target_column,
          task_type: body.task_type || 'classification',
          sensitive_features: body.sensitive_features,
        }),
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`)
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data.status === 'error') {
        return NextResponse.json(
          { error: data.message },
          { status: 400 }
        )
      }

      // Return analysis results
      return NextResponse.json(data)
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
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to process analysis' },
      { status: 500 }
    )
  }
}
