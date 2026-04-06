'use client'

interface ComparisonData {
  metric: string
  original: string | number
  after: string | number
  change: number // positive = improved
  unit?: string
}

interface ComparisonTableProps {
  data: ComparisonData[]
  isLoading?: boolean
}

export default function ComparisonTable({ data, isLoading }: ComparisonTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="skeleton h-5 w-48 rounded mb-5" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
          <svg className="w-5 h-5" style={{ color: '#818cf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Before vs After Comparison</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Original model vs after removing sensitive attributes</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left pb-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Metric</th>
              <th className="text-center pb-3 text-xs font-semibold" style={{ color: '#ef4444' }}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                  Original
                </div>
              </th>
              <th className="text-center pb-3 text-xs font-semibold" style={{ color: '#10b981' }}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                  After Removal
                </div>
              </th>
              <th className="text-center pb-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const changeColor = row.change > 0 ? '#10b981' : row.change < 0 ? '#ef4444' : 'var(--text-muted)'
              const changePrefix = row.change > 0 ? '+' : ''
              return (
                <tr
                  key={index}
                  className="transition-all duration-200 hover:bg-white/[0.02]"
                  style={{ borderBottom: index < data.length - 1 ? '1px solid rgba(30,32,64,0.5)' : 'none' }}
                >
                  <td className="py-3.5 pr-4">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.metric}</span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                      {row.original}{row.unit}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                      {row.after}{row.unit}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        color: changeColor,
                        background: row.change > 0 ? 'rgba(16,185,129,0.12)' : row.change < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      {row.change !== 0 && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          style={{ transform: row.change > 0 ? 'rotate(0deg)' : 'rotate(180deg)' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                      {changePrefix}{row.change}{row.unit}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary insight */}
      <div
        className="mt-4 p-3 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}
      >
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Removing the gender attribute improves the overall fairness score by{' '}
          <span style={{ color: '#10b981', fontWeight: 600 }}>
            +{data.find(d => d.metric === 'Fairness Score')?.change ?? 0} points
          </span>{' '}
          while maintaining model performance within acceptable bounds.
        </p>
      </div>
    </div>
  )
}
