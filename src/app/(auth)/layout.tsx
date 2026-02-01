'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from '@/components/splash-screen'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showSplash, setShowSplash] = useState(true)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)

  useEffect(() => {
    // Check if user has already seen splash in this session
    const seen = sessionStorage.getItem('splashSeen')
    if (seen) {
      setShowSplash(false)
      setHasSeenSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashSeen', 'true')
    setShowSplash(false)
    setHasSeenSplash(true)
  }

  return (
    <>
      {showSplash && !hasSeenSplash && (
        <SplashScreen onComplete={handleSplashComplete} minDuration={2000} />
      )}
      <ThemeToggle variant="floating" />
      {children}
    </>
  )
}
