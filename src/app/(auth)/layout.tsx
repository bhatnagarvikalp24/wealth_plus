'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from '@/components/splash-screen'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already seen splash in this session
    const seen = sessionStorage.getItem('splashSeen')
    if (!seen) {
      setShowSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashSeen', 'true')
    setShowSplash(false)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background" />
    )
  }

  return (
    <>
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} minDuration={2000} />
      )}
      <ThemeToggle variant="floating" />
      {children}
    </>
  )
}
