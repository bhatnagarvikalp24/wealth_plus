'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SplashScreenProps {
  onComplete?: () => void
  minDuration?: number
}

export function SplashScreen({ onComplete, minDuration = 1500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      // Wait for exit animation to complete
      setTimeout(() => {
        onComplete?.()
      }, 500)
    }, minDuration)

    return () => clearTimeout(timer)
  }, [minDuration, onComplete])

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 transition-opacity duration-500",
        isExiting && "opacity-0"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <div
          className={cn(
            "p-5 bg-white/10 rounded-2xl backdrop-blur-sm mb-6 transition-all duration-700",
            isExiting ? "scale-150 opacity-0" : "animate-bounce-gentle"
          )}
        >
          <TrendingUp className="h-16 w-16 text-white" />
        </div>

        {/* Brand Name */}
        <div
          className={cn(
            "flex items-center gap-1 transition-all duration-500",
            isExiting && "opacity-0 translate-y-4"
          )}
        >
          <span className="text-4xl font-bold text-white">The</span>
          <span className="text-4xl font-bold text-emerald-200">Finlog</span>
        </div>

        {/* Tagline */}
        <p
          className={cn(
            "text-emerald-100 mt-3 text-lg transition-all duration-500 delay-100",
            isExiting && "opacity-0 translate-y-4"
          )}
        >
          Your Financial Companion
        </p>

        {/* Loading Indicator */}
        <div
          className={cn(
            "mt-8 flex items-center gap-2 transition-all duration-500 delay-200",
            isExiting && "opacity-0"
          )}
        >
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
