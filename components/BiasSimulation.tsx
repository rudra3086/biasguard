'use client'

interface BiasSimulationProps {
  includeSensitiveAttr: boolean
  onToggle: (value: boolean) => void
  originalScore: number
  simulatedScore: number
}

export default function BiasSimulation({
  includeSensitiveAttr,
  onToggle,
  originalScore,
  simulatedScore,
}: BiasSimulationProps) {
  const diff = simulatedScore - originalScore
  const improvementColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : 'var(--text-secondary)'

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl" style={{ background: 'rgba(192, 132, 252, 0.12)' }}>
          <svg className="w-5 h-5" style={{ color: '#c084fc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Bias Simulation</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sensitivity analysis for feature removal</p>
        </div>
      </div>

      {/* Toggle */}
      <div
        className="flex items-center justify-between p-4 rounded-xl mb-5 cursor-pointer transition-all duration-300"
        style={{
          background: includeSensitiveAttr ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${includeSensitiveAttr ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
        }}
        onClick={() => onToggle(!includeSensitiveAttr)}
        id="toggle-sensitive-attr"
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Include Sensitive Attribute (Gender)
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {includeSensitiveAttr
              ? 'Gender is currently used in the model'
              : 'Gender has been removed from model inputs'}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          id="bias-simulation-toggle"
          className="relative w-12 h-6 rounded-full flex-shrink-0 transition-all duration-300 focus:outline-none"
          style={{ background: includeSensitiveAttr ? '#ef4444' : '#10b981' }}
          onClick={(e) => { e.stopPropagation(); onToggle(!includeSensitiveAttr) }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md toggle-thumb"
            style={{ transform: includeSensitiveAttr ? 'translateX(24px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {/* Simulation Scores visual */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>With Gender</p>
          <p className="text-3xl font-extrabold" style={{ color: '#ef4444' }}>{originalScore}</p>
          <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Biased</p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Without Gender</p>
          <p className="text-3xl font-extrabold" style={{ color: '#10b981' }}>{simulatedScore}</p>
          <p className="text-xs mt-1" style={{ color: '#10b981' }}>Improved</p>
        </div>
      </div>

      {/* Improvement arrow */}
      <div
        className="flex items-center justify-center gap-2 p-3 rounded-xl mb-4"
        style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}
      >
        <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
          +{diff} points improvement
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by removing gender attribute</span>
      </div>

      {/* Progress comparison */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Current (With Gender)</span>
            <span style={{ color: '#ef4444' }}>{originalScore}/100</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${originalScore}%`, background: '#ef4444' }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Simulated (Without Gender)</span>
            <span style={{ color: '#10b981' }}>{simulatedScore}/100</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${simulatedScore}%`, background: '#10b981' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
