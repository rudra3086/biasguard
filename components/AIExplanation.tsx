'use client'

import { useEffect, useState } from 'react'

interface AIExplanationProps {
  explanation: string
  isLoading?: boolean
  score: number
}

export default function AIExplanation({ explanation, isLoading, score }: AIExplanationProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!isLoading && explanation) {
      setDisplayedText('')
      setIsTyping(true)
      let i = 0
      const interval = setInterval(() => {
        if (i < explanation.length) {
          setDisplayedText(explanation.slice(0, i + 1))
          i++
        } else {
          setIsTyping(false)
          clearInterval(interval)
        }
      }, 18)
      return () => clearInterval(interval)
    }
  }, [explanation, isLoading])

  const insights = [
    {
      icon: '🔍',
      label: 'Root Cause',
      text: 'Imbalanced training data with underrepresentation of female applicants in positive outcome class (35% vs 70% approval rate).',
    },
    {
      icon: '📊',
      label: 'Statistical Significance',
      text: 'p-value < 0.001 confirms the observed disparity is statistically significant and not due to sampling variance.',
    },
    {
      icon: '⚡',
      label: 'Recommended Action',
      text: 'Apply re-weighting or oversampling techniques to the training dataset. Consider removing gender as a direct feature.',
    },
  ]

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(192,132,252,0.3))' }}
          >
            <svg className="w-4 h-4" style={{ color: '#818cf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          {!isLoading && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full pulse-dot" style={{ background: '#10b981' }} />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>AI Explanation Engine</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by BiasGuard LLM</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 pulse-dot" />
          Live Analysis
        </div>
      </div>

      {/* Main explanation */}
      <div
        className="rounded-xl p-4 mb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(192,132,252,0.05))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        {/* Decorative corner */}
        <div
          className="absolute top-0 right-0 w-24 h-24 opacity-10"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          }}
        />

        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analyzing model behavior...</span>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-4 rounded" style={{ width: `${[100, 85, 60][i - 1]}%` }} />
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-primary)' }}>
              {displayedText}
              {isTyping && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                  style={{ background: '#818cf8', verticalAlign: 'middle' }}
                />
              )}
            </p>
          </div>
        )}
      </div>

      {/* Insight cards */}
      {!isLoading && (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-xl transition-all duration-300 hover:border-opacity-80 animate-slide-up"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                animationDelay: `${i * 150}ms`,
              }}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{insight.icon}</span>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#818cf8' }}>{insight.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confidence score */}
      {!isLoading && (
        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analysis Confidence</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-1.5 rounded-full"
                  style={{ background: i < 4 ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>High (92%)</span>
          </div>
        </div>
      )}
    </div>
  )
}
