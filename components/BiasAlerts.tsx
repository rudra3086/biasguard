'use client'

interface Alert {
  id: string
  severity: 'critical' | 'high' | 'medium'
  title: string
  description: string
  metric: string
  value: string
  group: string
}

interface BiasAlertsProps {
  alerts: Alert[]
  isLoading?: boolean
}

interface BiasedCategory {
  name: string
  severity: 'critical' | 'high' | 'medium'
  count: number
}

const severityConfig = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.2)',
    badge: 'rgba(239, 68, 68, 0.15)',
    label: 'Critical',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  high: {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.2)',
    badge: 'rgba(249, 115, 22, 0.15)',
    label: 'High',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  medium: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.2)',
    badge: 'rgba(245, 158, 11, 0.15)',
    label: 'Medium',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

export default function BiasAlerts({ alerts, isLoading }: BiasAlertsProps) {
  // Extract biased categories from alerts
  const biasedCategories: BiasedCategory[] = []
  const categoryMap = new Map<string, { severity: 'critical' | 'high' | 'medium'; count: number }>()

  alerts.forEach(alert => {
    if (categoryMap.has(alert.group)) {
      const existing = categoryMap.get(alert.group)!
      existing.count += 1
      // Update severity to the highest
      const severityOrder = { critical: 3, high: 2, medium: 1 }
      if (severityOrder[alert.severity] > severityOrder[existing.severity]) {
        existing.severity = alert.severity
      }
    } else {
      categoryMap.set(alert.group, { severity: alert.severity, count: 1 })
    }
  })

  categoryMap.forEach((value, key) => {
    biasedCategories.push({ name: key, severity: value.severity, count: value.count })
  })

  // Sort by severity (critical > high > medium)
  biasedCategories.sort((a, b) => {
    const severityOrder = { critical: 3, high: 2, medium: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="skeleton h-5 w-36 rounded mb-5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-20 w-full rounded-xl mb-3" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <svg className="w-4 h-4" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Bias Alerts</h3>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
        >
          {alerts.length} Issues
        </span>
      </div>

      {/* Summary Section */}
      {biasedCategories.length > 0 && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>BIASED CATEGORIES ({biasedCategories.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {biasedCategories.map((category) => {
              const cfg = severityConfig[category.severity]
              return (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-3 rounded-lg transition-all"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0" style={{ color: cfg.color }}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {category.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{ background: cfg.badge, color: cfg.color }}
                    >
                      {category.count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const cfg = severityConfig[alert.severity]
          return (
            <div
              key={alert.id}
              className="rounded-xl p-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer animate-slide-up"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5 flex-shrink-0" style={{ color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.title}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: cfg.badge, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${cfg.border}` }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Metric:</span>
                  <span className="text-xs font-medium" style={{ color: cfg.color }}>{alert.metric}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Value:</span>
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{alert.value}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Group:</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{alert.group}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <svg className="w-6 h-6" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No Bias Detected</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Your model passes all fairness checks</p>
        </div>
      )}
    </div>
  )
}

export type { Alert }
