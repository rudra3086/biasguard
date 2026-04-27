'use client'

import { useEffect, useState } from 'react'

interface AIExplanationProps {
  analysis_data: {
    fairness_score: number
    high_bias_count: number
    medium_bias_count: number
    features?: any[]
  }
  isLoading?: boolean
}

export default function AIExplanation({ analysis_data, isLoading }: AIExplanationProps) {
  const [explanation, setExplanation] = useState<string>('')
  const [model, setModel] = useState<string>('loading...')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isLoading) return

    // Call backend to get Gemini explanation
    const fetchExplanation = async () => {
      try {
        const payload = {
          bias_analysis: {
            summary: {
              fairness_score: analysis_data.fairness_score,
            },
            features: analysis_data.features || [],
            trends: {
              total_features_analyzed: analysis_data.features?.length || 0,
              high_bias_count: analysis_data.high_bias_count,
              medium_bias_count: analysis_data.medium_bias_count,
            },
          },
        }
        
        console.log('Fetching explanation with payload:', payload)
        
        const response = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Received data:', data)
          setExplanation(data.analysis || '')
          setModel(data.model || 'unknown')
          setError('')
        } else {
          const errorData = await response.text()
          console.error('Response not ok:', response.status, errorData)
          setError(`Error: ${response.status}`)
          setExplanation('')
        }
      } catch (error) {
        console.error('Error fetching explanation:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setExplanation('')
      }
    }

    fetchExplanation()
  }, [analysis_data, isLoading])

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
            <svg className="w-5 h-5 animate-spin" style={{ color: '#a855f7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>AI Bias Analysis</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyzing with Gemini...</p>
          </div>
        </div>
        <div className="skeleton h-20 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
          <svg className="w-5 h-5" style={{ color: '#a855f7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>AI Bias Analysis (Gemini)</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {model === 'gemini-1.5-flash' ? '✓ Powered by Google Gemini' : '📋 Using Data-Based Analysis'}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg mb-3 text-xs"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        className="p-4 rounded-xl text-sm"
        style={{
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          minHeight: '150px',
          maxHeight: '500px',
          overflowY: 'auto',
        }}
      >
        {explanation ? (
          <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: 0, fontSize: '13px' }}>
            {explanation}
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {model === 'loading...' ? 'Fetching analysis...' : 'No analysis available'}
          </p>
        )}
      </div>
    </div>
  )
}
