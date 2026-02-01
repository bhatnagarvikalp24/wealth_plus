'use client'

import { useState, useEffect, ReactNode } from 'react'
import { OnboardingWizard } from './onboarding-wizard'

interface OnboardingCheckProps {
  children: ReactNode
}

export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding')
      if (response.ok) {
        const data = await response.json()
        setShowOnboarding(!data.onboardingCompleted)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  return <>{children}</>
}
