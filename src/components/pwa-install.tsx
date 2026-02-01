'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
      <button
        onClick={() => setShowInstallPrompt(false)}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Download className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Install The Finlog</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install our app for quick access and offline support
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Install
            </Button>
            <Button
              onClick={() => setShowInstallPrompt(false)}
              size="sm"
              variant="outline"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
