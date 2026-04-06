import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BiasGuard Lite — AI Fairness Monitoring Platform',
  description: 'Monitor, detect, and explain bias in your AI models with real-time fairness metrics, demographic analysis, and actionable insights.',
  keywords: 'AI fairness, bias detection, machine learning, fairness monitoring, disparate impact',
  authors: [{ name: 'BiasGuard Lite' }],
  openGraph: {
    title: 'BiasGuard Lite — AI Fairness Monitoring',
    description: 'Enterprise-grade AI fairness auditing for responsible machine learning.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
