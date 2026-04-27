import { NextResponse } from 'next/server'

interface ExplainRequest {
  bias_analysis: {
    summary: {
      fairness_score: number
    }
    features?: any[]
    trends?: {
      total_features_analyzed: number
      high_bias_count: number
      medium_bias_count: number
    }
  }
}

export async function POST(request: Request) {
  try {
    const body: ExplainRequest = await request.json()

    if (!body.bias_analysis) {
      return NextResponse.json(
        { error: 'Missing required field: bias_analysis' },
        { status: 400 }
      )
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${backendUrl}/api/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bias_analysis: body.bias_analysis,
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

      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Backend API error:', fetchError)
      return NextResponse.json(
        { error: `Backend error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
