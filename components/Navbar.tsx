'use client'

import { useState } from 'react'

interface NavbarProps {
  onUploadClick: () => void
}

export default function Navbar({ onUploadClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 px-4 sm:px-6 py-3"
      style={{
        background: 'rgba(10, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              BiasGuard{' '}
              <span className="gradient-text">Lite</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live Monitoring</span>
            </div>
          </div>
        </div>

        {/* Nav Links - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Models', 'Reports', 'Settings'].map((item, i) => (
            <button
              key={item}
              id={`nav-${item.toLowerCase()}`}
              className="px-4 py-2 text-sm rounded-xl transition-all duration-200 hover:text-white"
              style={{
                color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                background: i === 0 ? 'rgba(99,102,241,0.1)' : 'transparent',
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            id="nav-notifications"
            className="relative p-2 rounded-xl transition-all duration-200 hover:bg-white/5 hidden sm:flex"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: '#ef4444' }}
            />
          </button>

          {/* Upload button */}
          <button
            id="nav-upload-dataset"
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:opacity-90 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Upload Dataset</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer hidden sm:flex"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: 'white' }}
          >
            BG
          </div>

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-xl"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pb-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          {['Dashboard', 'Models', 'Reports', 'Settings'].map((item, i) => (
            <button
              key={item}
              className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all duration-200"
              style={{
                color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                background: i === 0 ? 'rgba(99,102,241,0.1)' : 'transparent',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
