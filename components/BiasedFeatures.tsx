'use client'

interface BiasedFeature {
  name: string
  disparate_impact: number
  variance: number
  groups_affected: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  group_approval_rates: Record<string, number>
  recommendation: string
}

interface BiasedFeaturesProps {
  features: BiasedFeature[]
  isLoading?: boolean
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' }
    case 'high':
      return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.25)' }
    case 'medium':
      return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' }
    default:
      return { color: '#84cc16', bg: 'rgba(132, 204, 22, 0.1)', border: 'rgba(132, 204, 22, 0.25)' }
  }
}

export default function BiasedFeatures({ features, isLoading }: BiasedFeaturesProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="skeleton h-5 w-40 rounded mb-4" />
            <div className="skeleton h-4 w-96 rounded mb-3" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (features.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-3 rounded-lg mx-auto mb-3 w-fit" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
          <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm mb-1">
          No Significant Bias Detected
        </p>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs">
          All analyzed features show approval rates above the 0.80 disparate impact threshold
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {features.map((feature, idx) => {
        const severity = getSeverityColor(feature.severity)
        const entries = Object.entries(feature.group_approval_rates)
        const maxRate = Math.max(...entries.map(([_, rate]) => rate))

        return (
          <div
            key={idx}
            className="rounded-2xl p-6 overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${severity.border}`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ background: severity.bg }}>
                  <svg className="w-4 h-4" style={{ color: severity.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {feature.name}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {feature.groups_affected} demographic {feature.groups_affected === 1 ? 'group' : 'groups'} affected
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: severity.bg,
                  color: severity.color,
                  border: `1px solid ${severity.border}`,
                  textTransform: 'capitalize',
                }}
              >
                {feature.severity}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid rgba(40,50,65,0.6)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Disparate Impact</p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {feature.disparate_impact.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Approval Variance</p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {feature.variance}%
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Threshold</p>
                <p className="text-sm font-semibold mt-1" style={{ color: feature.disparate_impact < 0.8 ? '#ef4444' : '#84cc16' }}>
                  {feature.disparate_impact < 0.8 ? '❌ Failed' : '✓ Passed'}
                </p>
              </div>
            </div>

            {/* Group Approval Rates */}
            <div className="mb-5">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Approval Rates by Group
              </p>
              <div className="space-y-2.5">
                {entries.map(([group, rate]) => (
                  <div key={group}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {group}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {Math.round(rate * 100)}%
                      </p>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(40,50,65,0.5)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(rate / maxRate) * 100}%`,
                          background: rate >= 0.8 ? '#10b981' : rate >= 0.6 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div className="flex gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {feature.recommendation}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type { BiasedFeature, BiasedFeaturesProps }
