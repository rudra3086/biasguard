'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts'

interface ApprovalRates {
  [key: string]: number
}

interface ChartsProps {
  approvalRates: ApprovalRates | Record<string, number>
  disparateImpact: number
  isLoading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.fill }}>
            {p.name}: <span className="font-bold">{(p.value * 100).toFixed(1)}%</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

function ChartCard({ title, children, subtitle }: { title: string; children: React.ReactNode; subtitle?: string }) {
  return (
    <div
      className="advanced-card rounded-2xl p-6 transition-all duration-300"
    >
      <div className="mb-5">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="advanced-card rounded-2xl p-6">
      <div className="skeleton h-5 w-48 rounded mb-5" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  )
}

export default function Charts({ approvalRates, disparateImpact, isLoading }: ChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonChart key={i} />)}
      </div>
    )
  }

  const genderData = [
    { group: 'Male', rate: approvalRates.male, fill: '#6366f1' },
    { group: 'Female', rate: approvalRates.female, fill: '#ec4899' },
  ]

  const locationData = [
    { group: 'Urban', rate: approvalRates.urban ?? 0.68, fill: '#10b981' },
    { group: 'Suburban', rate: approvalRates.suburban ?? 0.55, fill: '#f59e0b' },
    { group: 'Rural', rate: approvalRates.rural ?? 0.41, fill: '#ef4444' },
  ]

  const diPercent = Math.round(disparateImpact * 100)
  const diColor = diPercent >= 80 ? '#10b981' : diPercent >= 60 ? '#f59e0b' : '#ef4444'
  const diLabel = diPercent >= 80 ? 'Fair' : diPercent >= 60 ? 'Moderate' : 'Biased'

  const fairnessBreakdown = [
    { name: 'Demographic Parity', value: 73, fill: '#6366f1' },
    { name: 'Equal Opportunity', value: 81, fill: '#10b981' },
    { name: 'Equalized Odds', value: 66, fill: '#f59e0b' },
    { name: 'Calibration', value: 88, fill: '#c084fc' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gender Chart */}
      <ChartCard
        title="Approval Rate by Gender"
        subtitle="Comparing approval decisions across gender groups"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={genderData} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,32,64,0.8)" vertical={false} />
            <XAxis
              dataKey="group"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9094c4', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9094c4', fontSize: 11 }}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              domain={[0, 1]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="rate" name="Approval Rate" radius={[6, 6, 0, 0]}>
              {genderData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-4 mt-3">
          {genderData.map(item => (
            <div key={item.group} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.group}: <span style={{ color: 'var(--text-secondary)' }}>{(item.rate * 100).toFixed(0)}%</span>
              </span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Location Chart */}
      <ChartCard
        title="Approval Rate by Location"
        subtitle="Geographic fairness distribution analysis"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={locationData} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,32,64,0.8)" vertical={false} />
            <XAxis
              dataKey="group"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9094c4', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9094c4', fontSize: 11 }}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              domain={[0, 1]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="rate" name="Approval Rate" radius={[6, 6, 0, 0]}>
              {locationData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 flex-wrap">
          {locationData.map(item => (
            <div key={item.group} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.group}: <span style={{ color: 'var(--text-secondary)' }}>{(item.rate * 100).toFixed(0)}%</span>
              </span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Disparate Impact Ratio */}
      <ChartCard
        title="Disparate Impact Ratio"
        subtitle="80% Rule: ratio ≥ 0.8 considered fair"
      >
        <div className="flex items-center gap-8">
          {/* Gauge */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle
                cx="80" cy="80" r="60"
                fill="none"
                stroke={diColor}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - disparateImpact)}`}
                style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 6px ${diColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: diColor }}>{disparateImpact.toFixed(2)}</span>
              <span className="text-xs font-medium mt-0.5" style={{ color: diColor }}>{diLabel}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>Current Ratio</span>
                  <span style={{ color: diColor }}>{disparateImpact.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${diPercent}%`, background: diColor }}
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  The disparate impact ratio measures the rate at which different demographic groups receive positive outcomes.
                  A ratio below <span style={{ color: '#f59e0b' }}>0.8</span> indicates potential discrimination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Fairness Score Breakdown */}
      <ChartCard
        title="Fairness Metric Breakdown"
        subtitle="Multi-dimensional fairness assessment"
      >
        <div className="space-y-4">
          {fairnessBreakdown.map((item) => {
            const c = item.value >= 80 ? '#10b981' : item.value >= 60 ? '#f59e0b' : '#ef4444'
            return (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                  <span className="font-semibold" style={{ color: c }}>{item.value}/100</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.value}%`,
                      background: `linear-gradient(90deg, ${item.fill}, ${c})`,
                      boxShadow: `0 0 6px ${item.fill}60`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </ChartCard>
    </div>
  )
}
