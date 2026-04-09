'use client'

import { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import FairnessScoreCard from '@/components/FairnessScoreCard'
import QuickStats from '@/components/QuickStats'
import Charts from '@/components/Charts'
import BiasAlerts from '@/components/BiasAlerts'
import AIExplanation from '@/components/AIExplanation'
import DatasetUpload from '@/components/DatasetUpload'
// `ComparisonTable` (before/after mitigation comparison) removed per request
import type { Alert } from '@/components/BiasAlerts'

interface AppData {
  fairness_score: number
  approval_rates: Record<string, number>
  disparate_impact: number
  disparate_impact_education?: number
  disparate_impact_employment?: number
  bias_detected: boolean
  explanation: string
  total_samples: number
  demographic_groups: number
  features?: any[]
}

function generateAlertsFromData(data: AppData): Alert[] {
  const alerts: Alert[] = []

  if (data.disparate_impact_education && data.disparate_impact_education < 0.8) {
    alerts.push({
      id: '1',
      severity: 'critical',
      title: 'Education-Based Disparate Impact',
      description: `Graduate applicants have significantly higher approval rates than non-graduates. Disparate impact ratio: ${data.disparate_impact_education}`,
      metric: 'Disparate Impact',
      value: data.disparate_impact_education.toString(),
      group: 'Education',
    })
  }

  if (data.disparate_impact_employment && data.disparate_impact_employment < 0.8) {
    alerts.push({
      id: '2',
      severity: 'high',
      title: 'Employment Status Bias Detected',
      description: `Self-employed and employed applicants receive different approval rates. Disparate impact ratio: ${data.disparate_impact_employment}`,
      metric: 'Approval Gap',
      value: `${Math.round(Math.abs((data.approval_rates.self_employed || 0) - (data.approval_rates.employed || 0)) * 100)}%`,
      group: 'Employment',
    })
  }

  const highIncomeRate = data.approval_rates.high_income || 0
  const lowIncomeRate = data.approval_rates.low_income || 0
  if (Math.abs(highIncomeRate - lowIncomeRate) > 0.25) {
    alerts.push({
      id: '3',
      severity: 'medium',
      title: 'Income-Based Approval Variance',
      description: `High income applicants have ${Math.round((highIncomeRate - lowIncomeRate) * 100)}% higher approval rates than low income applicants.`,
      metric: 'Approval Gap',
      value: `${Math.round((highIncomeRate - lowIncomeRate) * 100)}%`,
      group: 'Income',
    })
  }

  return alerts
}

// Comparison generation removed — mitigation-scenario comparison was deprecated

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

  // Only calculate values if data exists
  const currentScore = data ? data.fairness_score : 0
  const currentRates = data ? data.approval_rates : {}
  const currentDI = data ? data.disparate_impact : 0
  const currentBiasDetected = data ? data.bias_detected : false
  const currentAlerts = data ? generateAlertsFromData(data) : []

  return (
    <div className="min-h-screen app-shell" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onUploadClick={handleUploadClick} />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 fade-in-up">
        {data && (
          <>
            {/* Hero Banner */}
            <div className="hero-panel rounded-2xl p-6 sm:p-8 overflow-hidden relative">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(59,130,246,0.14)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}
                    >
                      AI Fairness Audit v2.4
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />
                      {currentBiasDetected ? 'Bias Detected' : 'Fair Model'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Model Fairness Dashboard
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Real-time bias monitoring · Loan Approval Model v3.1 · Last analyzed 2 min ago
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    id="refresh-analysis-btn"
                    className="btn-subtle flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-300"
                    onClick={() => {
                      setIsLoading(true)
                      setTimeout(() => setIsLoading(false), 1500)
                    }}
                  >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    id="export-report-btn"
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:opacity-90"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                  </button>
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

            {/* Main Grid: Score + Alerts + AI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Fairness Score */}
              <div className="lg:col-span-1">
                <FairnessScoreCard score={currentScore} isLoading={isLoading} />
              </div>

              {/* Right: Bias Alerts + AI Explanation */}
              <div className="lg:col-span-2 space-y-6">
                <BiasAlerts alerts={currentAlerts} isLoading={isLoading} />
                <AIExplanation
                  explanation={data.explanation}
                  isLoading={isLoading}
                  score={currentScore}
                />
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
              />
            </section>

            {/* Mitigation comparison removed */}
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
                  {[
                    { label: 'Name', value: 'Loaded Dataset' },
                    { label: 'Records', value: data.total_samples.toLocaleString() },
                    { label: 'Features', value: '13 columns' },
                    { label: 'Target', value: 'loan_status (binary)' },
                    { label: 'Analyzed Attrs', value: 'Education, Employment, Income' },
                    { label: 'Last Updated', value: 'Apr 6, 2026 · Real-time' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(40,50,65,0.6)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.value}</span>
                    </div>
                  ))}
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
            BiasGuard Lite · AI Fairness Monitoring Platform · v2.4.1 ·{' '}
            <span style={{ color: 'var(--accent-light)' }}>Powered by BiasGuard LLM</span>
          </p>
        </footer>
      </main>
    </div>
  )
}
