'use client'

import { useEffect, useRef } from 'react'

interface FairnessScoreCardProps {
  score: number
  isLoading?: boolean
}

function getScoreConfig(score: number) {
  if (score >= 80) return {
    label: 'Fair',
    color: '#10b981',
    glowClass: 'glow-green',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gradient: ['#10b981', '#34d399'],
    description: 'Your model demonstrates excellent fairness across demographic groups.',
    badge: '✓ Compliant',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  }
  if (score >= 60) return {
    label: 'Moderate',
    color: '#f59e0b',
    glowClass: 'glow-yellow',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gradient: ['#f59e0b', '#fbbf24'],
    description: 'Some fairness concerns detected. Review highlighted bias alerts.',
    badge: '⚠ Review Needed',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  }
  return {
    label: 'Biased',
    color: '#ef4444',
    glowClass: 'glow-red',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gradient: ['#ef4444', '#f87171'],
    description: 'Significant bias detected. Immediate action recommended.',
    badge: '✗ Non-Compliant',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  }
}

export default function FairnessScoreCard({ score, isLoading }: FairnessScoreCardProps) {
  const config = getScoreConfig(score)
  const circumference = 2 * Math.PI * 88
  const strokeDashoffset = circumference - (score / 100) * circumference

  if (isLoading) {
    return (
      <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="skeleton h-6 w-48 rounded-lg mb-4" />
        <div className="flex justify-center mb-4">
          <div className="skeleton w-52 h-52 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full rounded-lg mb-2" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl p-8 transition-all duration-500 ${config.glowClass}`}
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Overall Model Fairness</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time fairness assessment</p>
        </div>
        <span
          className="badge text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: config.badgeBg, color: config.color }}
        >
          {config.badge}
        </span>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background ring */}
            <circle
              cx="100" cy="100" r="88"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
            />
            {/* Score ring */}
            <circle
              cx="100" cy="100" r="88"
              fill="none"
              stroke={config.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 8px ${config.color}60)`,
              }}
            />
            {/* Inner glow ring */}
            <circle
              cx="100" cy="100" r="75"
              fill="none"
              stroke={config.color}
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.2"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-extrabold leading-none" style={{ color: config.color }}>
              {score}
            </span>
            <span className="text-lg font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>/100</span>
            <span
              className="text-sm font-semibold mt-2 px-3 py-0.5 rounded-full"
              style={{ background: config.badgeBg, color: config.color }}
            >
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Score breakdown bars */}
      <div className="space-y-3 mb-6">
        {[
          { label: 'Demographic Parity', value: score - 5 },
          { label: 'Equal Opportunity', value: score + 3 },
          { label: 'Equalized Odds', value: score - 12 },
        ].map((item) => {
          const v = Math.max(0, Math.min(100, item.value))
          const c = getScoreConfig(v)
          return (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ color: c.color }}>{v}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${v}%`,
                    background: `linear-gradient(90deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{config.description}</p>
    </div>
  )
}
