'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/Navbar'
import FairnessScoreCard from '@/components/FairnessScoreCard'
import QuickStats from '@/components/QuickStats'
import Charts from '@/components/Charts'
import BiasAlerts from '@/components/BiasAlerts'
import AIExplanation from '@/components/AIExplanation'
import DatasetUpload from '@/components/DatasetUpload'
import type { Alert } from '@/components/BiasAlerts'

interface AppData {
  fairness_score: number
  approval_rates: Record<string, number>
  disparate_impact: number
  bias_detected: boolean
  total_samples: number
  demographic_groups: number
  demographic_categories?: Array<{ column: string; type: string; description: string }>
  features?: any[]
  alerts?: Alert[]
}

function getDisparateImpactCalculation(data: AppData): { calculation: string; feature: string; minGroup: string; maxGroup: string; minRate: number; maxRate: number } | null {
  if (!data.features || data.features.length === 0) {
    return null
  }

  // Find feature with worst (minimum) bias_ratio
  let worstFeature = data.features[0]
  let worstRatio = worstFeature.bias_ratio ?? 1.0

  for (const feature of data.features) {
    const ratio = feature.bias_ratio ?? 1.0
    if (ratio < worstRatio) {
      worstRatio = ratio
      worstFeature = feature
    }
  }

  if (!worstFeature.groups) {
    return null
  }

  // Find min and max approval rates
  const rates = Object.entries(worstFeature.groups)
    .map(([group, rate]) => ({ group, rate: typeof rate === 'number' ? rate : 0 }))
    .sort((a, b) => a.rate - b.rate)

  if (rates.length < 2) {
    return null
  }

  const minRate = rates[0].rate
  const maxRate = rates[rates.length - 1].rate
  const minGroup = rates[0].group
  const maxGroup = rates[rates.length - 1].group

  const calculation = `${(minRate * 100).toFixed(1)}% / ${(maxRate * 100).toFixed(1)}% = ${worstRatio.toFixed(3)}`

  return {
    calculation,
    feature: worstFeature.feature,
    minGroup,
    maxGroup,
    minRate,
    maxRate,
  }
}

function generateAlertsFromFeatures(data: AppData): Alert[] {
  const alerts: Alert[] = []

  // Generate alerts based on actual features from analysis
  if (data.features && Array.isArray(data.features)) {
    data.features.forEach((feature, index) => {
      if (feature.bias_score >= 0.2) {
        const severity = feature.bias_score >= 0.3 ? 'critical' : feature.bias_score >= 0.2 ? 'high' : 'medium'
        const featureName = feature.feature || feature.name || `Feature ${index + 1}`
        alerts.push({
          id: String(index + 1),
          severity,
          title: `Bias Detected in ${featureName}`,
          description: `Feature "${featureName}" shows disparate impact with a bias score of ${feature.bias_score.toFixed(3)}.`,
          metric: 'Bias Score',
          value: feature.bias_score.toFixed(3),
          group: featureName,
        })
      }
    })
  }

  // If no feature-based alerts, check overall disparate impact
  if (alerts.length === 0 && data.disparate_impact < 0.8) {
    alerts.push({
      id: '1',
      severity: 'high',
      title: 'Overall Disparate Impact Detected',
      description: `Overall disparate impact ratio is ${data.disparate_impact.toFixed(3)}, indicating potential bias across demographic groups.`,
      metric: 'Disparate Impact',
      value: data.disparate_impact.toFixed(3),
      group: 'Overall',
    })
  }

  return alerts
}

// ── Page Component ────────────────────────────────────────────
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<AppData | null>(null)
  const [showUploadSection, setShowUploadSection] = useState(false)
  const uploadRef = useRef<HTMLDivElement>(null)

  const handleUploadClick = () => {
    setShowUploadSection(true)
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDataLoaded = (analysisData: AppData & { fileName: string }) => {
    setData(analysisData)
  }

  const currentScore = data ? data.fairness_score : 0
  const currentRates = data ? data.approval_rates : {}
  const currentDI = data ? data.disparate_impact : 0
  const currentBiasDetected = data ? data.bias_detected : false
  const currentAlerts = data ? generateAlertsFromFeatures(data) : []

  return (
    <div className="min-h-screen app-shell" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onUploadClick={handleUploadClick} />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 fade-in-up">
        {data && (
          <>
            <div className="hero-panel rounded-2xl p-6 sm:p-8 overflow-hidden relative">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(59,130,246,0.14)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}
                    >
                      Bias Analysis
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />
                      {currentBiasDetected ? 'Bias Detected' : 'No Bias'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Fairness Analysis Dashboard
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Upload a CSV dataset to analyze for bias and fairness issues
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <QuickStats
              totalSamples={data.total_samples}
              demographicGroups={data.demographic_groups}
              biasDetected={currentBiasDetected}
              isLoading={isLoading}
            />

            {/* Main Grid: Score + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Fairness Score */}
              <div className="lg:col-span-1">
                <FairnessScoreCard score={currentScore} isLoading={isLoading} />
              </div>

              {/* Right: Bias Alerts */}
              <div className="lg:col-span-2">
                <BiasAlerts alerts={currentAlerts} isLoading={isLoading} />
              </div>
            </div>

            {/* Charts Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <span className="section-heading">Fairness Analytics</span>
                </h2>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Showing data for {data.total_samples.toLocaleString()} samples
                </span>
              </div>
              <Charts
                approvalRates={currentRates}
                disparateImpact={currentDI}
                features={data.features}
                isLoading={isLoading}
                demographicCategories={data.demographic_categories}
              />
            </section>

            {/* AI Explanation Section */}
            <section>
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <span className="section-heading">🤖 AI-Powered Bias Analysis</span>
              </h2>
              <AIExplanation
                analysis_data={{
                  fairness_score: currentScore / 100,
                  high_bias_count: currentAlerts.filter(a => a.severity === 'critical').length,
                  medium_bias_count: currentAlerts.filter(a => a.severity === 'high').length,
                  features: data.features,
                }}
                isLoading={isLoading}
              />
            </section>
          </>
        )}

        {/* Dataset Upload */}
        <div ref={uploadRef} id="upload-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              <span className="section-heading">Dataset Management</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatasetUpload onDataLoaded={handleDataLoaded} />

            {/* Dataset info panel */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Current Dataset</h3>
              {data ? (
                <div className="space-y-3">
                  {(() => {
                    const disparateImpactCalc = getDisparateImpactCalculation(data)
                    const baseItems = [
                      { label: 'Records Analyzed', value: data.total_samples.toLocaleString() },
                      { label: 'Fairness Score', value: `${currentScore.toFixed(1)}%` },
                      { label: 'Demographic Groups', value: data.demographic_groups },
                      { label: 'Bias Detected', value: currentBiasDetected ? 'Yes' : 'No' },
                    ]

                    return baseItems.map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(40,50,65,0.6)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.value}</span>
                      </div>
                    )).concat(
                      // Disparate Impact with calculation
                      <div key="disparate-impact" className="py-2" style={{ borderBottom: '1px solid rgba(40,50,65,0.6)' }}>
                        <div className="flex justify-between items-start">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Disparate Impact</span>
                          <div className="text-right">
                            <div className="text-xs font-medium" style={{ color: currentDI < 0.8 ? '#ef4444' : 'var(--text-secondary)' }}>
                              {currentDI.toFixed(3)}
                            </div>
                            {currentDI < 0.8 && disparateImpactCalc && (
                              <div className="text-xs mt-1 px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                                {disparateImpactCalc.feature}: {disparateImpactCalc.calculation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ).concat([
                      <div key="status" className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(40,50,65,0.6)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Analysis Complete</span>
                      </div>
                    ])
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No dataset loaded. Upload a CSV file to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-4 pb-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            BiasGuard · Fairness Analysis Platform
          </p>
        </footer>
      </main>
    </div>
  )
}
