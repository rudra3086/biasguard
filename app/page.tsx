'use client'

import { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import FairnessScoreCard from '@/components/FairnessScoreCard'
import QuickStats from '@/components/QuickStats'
import Charts from '@/components/Charts'
import BiasAlerts from '@/components/BiasAlerts'
import AIExplanation from '@/components/AIExplanation'
import DatasetUpload from '@/components/DatasetUpload'
import BiasSimulation from '@/components/BiasSimulation'
import ComparisonTable from '@/components/ComparisonTable'
import type { Alert } from '@/components/BiasAlerts'

// ── Mock Data ─────────────────────────────────────────────────
const MOCK_DATA = {
  fairness_score: 78,
  approval_rates: { male: 0.7, female: 0.35, urban: 0.68, rural: 0.41, suburban: 0.55 },
  disparate_impact: 0.5,
  bias_detected: true,
  explanation:
    'The model exhibits statistically significant gender bias, with female applicants receiving approval at only 35% compared to 70% for male applicants. This disparity stems from historical imbalances in the training dataset, where positive outcomes were predominantly associated with male demographic profiles. The disparate impact ratio of 0.50 falls well below the 0.80 threshold required by fair lending standards, indicating systemic discrimination risk.',
  total_samples: 12847,
  demographic_groups: 6,
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'Gender Disparity in Approval Rates',
    description:
      'Female applicants have significantly lower approval rates (35%) than male applicants (70%), a 2× disparity that violates fair lending standards.',
    metric: 'Disparate Impact',
    value: '0.50',
    group: 'Gender',
  },
  {
    id: '2',
    severity: 'high',
    title: 'Geographic Bias Detected',
    description:
      'Rural applicants receive approvals at 41% vs 68% for urban applicants. Location-based bias may correlate with protected classes.',
    metric: 'Approval Gap',
    value: '27%',
    group: 'Location',
  },
  {
    id: '3',
    severity: 'medium',
    title: 'Low Equalized Odds Score',
    description:
      'True Positive Rate for female applicants (0.52) significantly lags behind male applicants (0.81), indicating unequal model performance.',
    metric: 'TPR Parity',
    value: '0.64',
    group: 'Gender',
  },
]

const COMPARISON_DATA = [
  { metric: 'Fairness Score', original: 78, after: 91, change: 13 },
  { metric: 'Male Approval Rate', original: '70%', after: '68%', change: -2 },
  { metric: 'Female Approval Rate', original: '35%', after: '67%', change: 32 },
  { metric: 'Disparate Impact', original: '0.50', after: '0.99', change: 49 },
  { metric: 'Equal Opportunity', original: '0.64', after: '0.95', change: 31 },
  { metric: 'Model Accuracy', original: '87%', after: '84%', change: -3 },
]

// ── Page Component ────────────────────────────────────────────
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState(MOCK_DATA)
  const [includeSensitiveAttr, setIncludeSensitiveAttr] = useState(true)
  const [showUploadSection, setShowUploadSection] = useState(false)
  const uploadRef = useRef<HTMLDivElement>(null)

  // Simulate initial data load
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1800)
  }, [])

  const handleUploadClick = () => {
    setShowUploadSection(true)
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDataLoaded = (file: { name: string; rows: number; columns: number; size: string }) => {
    setIsLoading(true)
    setTimeout(() => {
      setData({
        ...MOCK_DATA,
        total_samples: file.rows,
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleSimulationToggle = (value: boolean) => {
    setIncludeSensitiveAttr(value)
  }

  const currentScore = includeSensitiveAttr ? data.fairness_score : 91
  const currentRates = includeSensitiveAttr
    ? data.approval_rates
    : { ...data.approval_rates, female: 0.67 }
  const currentDI = includeSensitiveAttr ? data.disparate_impact : 0.99
  const currentBiasDetected = includeSensitiveAttr ? data.bias_detected : false
  const currentAlerts = includeSensitiveAttr ? MOCK_ALERTS : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onUploadClick={handleUploadClick} />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Hero Banner */}
        <div
          className="rounded-2xl p-6 sm:p-8 overflow-hidden relative"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:bg-white/10"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:opacity-90"
                style={{ background: 'rgba(59,130,246,0.14)', color: '#bfdbfe', border: '1px solid rgba(59,130,246,0.35)' }}
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
              Fairness Analytics
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing data for {data.total_samples.toLocaleString()} samples
            </span>
          </div>
          <Charts
            approvalRates={currentRates}
            disparateImpact={currentDI}
            isLoading={isLoading}
          />
        </section>

        {/* Bottom Grid: Simulation + Comparison + Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BiasSimulation
            includeSensitiveAttr={includeSensitiveAttr}
            onToggle={handleSimulationToggle}
            originalScore={data.fairness_score}
            simulatedScore={91}
          />
          <ComparisonTable data={COMPARISON_DATA} isLoading={isLoading} />
        </div>

        {/* Dataset Upload */}
        <div ref={uploadRef} id="upload-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Dataset Management
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatasetUpload onDataLoaded={handleDataLoaded} />

            {/* Dataset info panel */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Current Dataset</h3>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: 'loan_applications_2024.csv' },
                  { label: 'Records', value: data.total_samples.toLocaleString() },
                  { label: 'Features', value: '24 columns' },
                  { label: 'Target', value: 'loan_approved (binary)' },
                  { label: 'Protected Attrs', value: 'gender, location, age' },
                  { label: 'Last Updated', value: 'Apr 6, 2026 · 10:23 AM' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(40,50,65,0.6)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
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
