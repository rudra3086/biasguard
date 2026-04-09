'use client'

interface QuickStatsProps {
  totalSamples: number
  demographicGroups: number
  biasDetected: boolean
  isLoading?: boolean
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
  isLoading,
}: {
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
  sub?: string
  color: string
  bg: string
  isLoading?: boolean
}) {
  return (
    <div
      className="advanced-card rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 group"
    >
      <div
        className="p-3 rounded-xl flex-shrink-0 transition-all duration-300"
        style={{ background: bg }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {isLoading ? (
          <div className="skeleton h-8 w-24 rounded-lg" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        )}
        {sub && !isLoading && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

export default function QuickStats({ totalSamples, demographicGroups, biasDetected, isLoading }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        label="Total Samples"
        value={totalSamples.toLocaleString()}
        sub="Dataset records analyzed"
        color="var(--accent-light)"
        bg="rgba(59, 130, 246, 0.12)"
        isLoading={isLoading}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        label="Demographic Groups"
        value={demographicGroups}
        sub="Subgroups under assessment"
        color="#7dd3fc"
        bg="rgba(125, 211, 252, 0.12)"
        isLoading={isLoading}
      />
      <StatCard
        icon={
          biasDetected ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
        label="Bias Detected"
        value={
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
            style={{
              background: biasDetected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: biasDetected ? '#ef4444' : '#10b981',
            }}
          >
            <span
              className="w-2 h-2 rounded-full pulse-dot"
              style={{ background: biasDetected ? '#ef4444' : '#10b981' }}
            />
            {biasDetected ? 'Yes' : 'No'}
          </span>
        }
        sub={biasDetected ? 'Action required' : 'All checks passed'}
        color={biasDetected ? '#ef4444' : '#10b981'}
        bg={biasDetected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}
        isLoading={isLoading}
      />
    </div>
  )
}
