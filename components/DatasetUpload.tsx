'use client'

import { useState, useCallback } from 'react'

interface DatasetInfo {
  column_names: string[]
  data_types: Record<string, string>
  missing_values: Record<string, number>
  unique_counts: Record<string, number>
}

interface BiasAnalysisSummary {
  fairness_score: number
  most_biased_feature: string | null
  total_features_analyzed: number
  sensitive_features_detected: string[]
  dataset_shape: { rows: number; columns: number }
}

interface BiasAnalysisResult {
  status: string
  summary: BiasAnalysisSummary
  features: Array<{
    feature: string
    type: string
    groups: Record<string, number>
    bias_score: number
    bias_ratio: number
    severity: string
    groups_affected: number
  }>
  explanations: Record<string, string>
  trends: {
    total_features_analyzed: number
    high_bias_count: number
    medium_bias_count: number
    low_bias_count: number
    high_bias_percentage: number
    recommendation: string
  }
  explainability: {
    top_biased_features: Array<{ feature: string; bias_contribution: number; impact_percentage: number }>
    total_bias_score: number
  }
  demographic_detection?: {
    demographic_categories?: Array<{ column: string; type: string; description: string }>;
    non_demographic_columns?: string[];
    explanation?: string;
  }
  recommendations: string
}

interface UploadedFile {
  name: string
  rows: number
  columns: number
  size: string
  file_id: string
}

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
  demographic_categories?: Array<{
    column: string
    type: string
    description: string
  }>
  features?: Array<{
    feature: string
    type: string
    groups: Record<string, number>
    bias_score: number
    bias_ratio: number
    severity: string
    groups_affected: number
  }>
}

interface DatasetUploadProps {
  onDataLoaded: (data: AppData & { fileName: string }) => void
}

export default function DatasetUpload({ onDataLoaded }: DatasetUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [targetColumn, setTargetColumn] = useState<string>('')
  const [taskType, setTaskType] = useState<string>('classification')

  const processFile = useCallback((uploadedFile: File) => {
    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', uploadedFile)

    fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Upload failed')
        }
        return res.json()
      })
      .then((data) => {
        const fileInfo: UploadedFile = {
          name: data.filename,
          rows: data.dataset_shape.rows,
          columns: data.dataset_shape.columns,
          size: '~' + (Math.round(uploadedFile.size / 1024)) + ' KB',
          file_id: data.file_id,
        }
        setFile(fileInfo)
        setDatasetInfo(data.dataset_info)
        // Auto-select first column as target if available
        if (data.dataset_info.column_names.length > 0) {
          setTargetColumn(data.dataset_info.column_names[data.dataset_info.column_names.length - 1])
        }
      })
      .catch((err) => {
        setError(err.message)
        console.error('Upload error:', err)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [])

  const runAnalysis = useCallback(() => {
    if (!file || !targetColumn) {
      setError('Please select a target column')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: file.file_id,
        target_column: targetColumn,
        task_type: taskType,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          const errorMsg = errorData.error || errorData.detail || 'Analysis failed'
          throw new Error(errorMsg)
        }
        return res.json() as Promise<BiasAnalysisResult>
      })
      .then((data) => {
        // Transform BiasAnalysisResult to AppData format
        // Build approval rates from all groups in all features
        const approval_rates: Record<string, number> = {}
        data.features.forEach(f => {
          if (f.groups) {
            Object.entries(f.groups).forEach(([group, rate]) => {
              if (rate !== null && rate !== undefined) {
                approval_rates[group] = typeof rate === 'number' ? rate : 0
              }
            })
          }
        })

        // Calculate overall disparate impact (minimum bias_ratio across all features)
        const disparate_impact_values = data.features
          .map((f: any) => f.bias_ratio)
          .filter((ratio: number) => ratio !== null && ratio !== undefined && ratio > 0)
        const overall_disparate_impact = disparate_impact_values.length > 0 
          ? Math.min(...disparate_impact_values)
          : 0.8

        const transformedData: AppData & { fileName: string } = {
          fairness_score: Math.round(data.summary.fairness_score * 100),
          approval_rates: approval_rates,
          disparate_impact: overall_disparate_impact,
          disparate_impact_education: data.features.find((f: any) => f.feature.toLowerCase().includes('education'))?.bias_ratio,
          disparate_impact_employment: data.features.find((f: any) => f.feature.toLowerCase().includes('employment'))?.bias_ratio,
          bias_detected: data.trends.high_bias_count > 0 || data.trends.medium_bias_count > 0,
          explanation: data.trends.recommendation || 'Analysis complete',
          total_samples: file.rows,
          demographic_groups: data.summary.total_features_analyzed,
          demographic_categories: data.demographic_detection?.demographic_categories || [],
          fileName: file.name,
          features: data.features,
        }
        
        onDataLoaded(transformedData)
      })
      .catch((err) => {
        setError(err.message)
        console.error('Analysis error:', err)
      })
      .finally(() => {
        setIsAnalyzing(false)
      })
  }, [file, targetColumn, taskType, onDataLoaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      processFile(droppedFile)
    }
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) processFile(selectedFile)
  }, [processFile])

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--accent-light)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Dataset Upload</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CSV format supported</p>
        </div>
      </div>

      {!file && !isProcessing && (
        <>
          <div
            id="upload-dropzone"
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'drag-active' : ''}`}
            style={{
              borderColor: isDragging ? 'var(--accent)' : 'var(--border-light)',
              background: isDragging ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--accent-light)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {isDragging ? 'Drop your file here' : 'Drag & drop your dataset'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>or click to browse files</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                .csv
              </span>
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs" style={{ color: '#ef4444' }}>Error: {error}</p>
            </div>
          )}
        </>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--accent-light)', borderRightColor: 'rgba(96,165,250,0.35)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uploading and analyzing dataset...</p>
        </div>
      )}

      {file && !isProcessing && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                  <svg className="w-4 h-4" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{file.size}</p>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setDatasetInfo(null); setError(null) }}
                className="text-xs px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>{file.rows.toLocaleString()}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Rows</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent-light)' }}>{file.columns}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Columns</p>
              </div>
            </div>
          </div>

          {datasetInfo && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Target Column
                </label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Select target column...</option>
                  {datasetInfo.column_names.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="classification">Classification</option>
                  <option value="regression">Regression</option>
                </select>
              </div>

              {error && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs" style={{ color: '#ef4444' }}>Error: {error}</p>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || !targetColumn}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: targetColumn && !isAnalyzing ? 'var(--accent)' : 'rgba(59,130,246,0.3)',
                  color: 'white',
                  opacity: targetColumn && !isAnalyzing ? 1 : 0.6,
                }}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
