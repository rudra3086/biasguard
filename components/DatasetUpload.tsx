'use client'

import { useState, useCallback } from 'react'

interface UploadedFile {
  name: string
  rows: number
  columns: number
  size: string
}

interface DatasetUploadProps {
  onDataLoaded: (data: UploadedFile) => void
}

export default function DatasetUpload({ onDataLoaded }: DatasetUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback((uploadedFile: File) => {
    setIsProcessing(true)
    setTimeout(() => {
      const mockData: UploadedFile = {
        name: uploadedFile.name,
        rows: Math.floor(Math.random() * 9000) + 1000,
        columns: Math.floor(Math.random() * 10) + 8,
        size: (uploadedFile.size / 1024).toFixed(1) + ' KB',
      }
      setFile(mockData)
      setIsProcessing(false)
      onDataLoaded(mockData)
    }, 1500)
  }, [onDataLoaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.json'))) {
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
        <div className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--accent-light)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Dataset Upload</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CSV or JSON supported</p>
        </div>
      </div>

      {!file && !isProcessing && (
        <div
          id="upload-dropzone"
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'drag-active' : ''}`}
          style={{
            borderColor: isDragging ? 'var(--accent)' : 'var(--border-light)',
            background: isDragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
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
              .csv / .json
            </span>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-r-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analyzing dataset...</p>
        </div>
      )}

      {file && !isProcessing && (
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
              onClick={() => setFile(null)}
              className="text-xs px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Remove
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
      )}
    </div>
  )
}
