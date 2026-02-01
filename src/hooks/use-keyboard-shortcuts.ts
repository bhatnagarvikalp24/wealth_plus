'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  onNewEntry?: () => void
  onQuickSearch?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onNewEntry,
  onQuickSearch,
  enabled = true,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? event.metaKey : event.ctrlKey

      // Cmd/Ctrl + K - Quick search
      if (modKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onQuickSearch?.()
        return
      }

      // Single key shortcuts (no modifier)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            // N - New entry (context-aware)
            event.preventDefault()
            onNewEntry?.()
            break
          case 'd':
            // D - Go to Dashboard
            event.preventDefault()
            router.push('/dashboard')
            break
          case 'i':
            // I - Go to Income
            event.preventDefault()
            router.push('/income')
            break
          case 'e':
            // E - Go to Expenses
            event.preventDefault()
            router.push('/expenses')
            break
          case 's':
            // S - Go to Savings
            event.preventDefault()
            router.push('/savings')
            break
          case '?':
            // ? - Show shortcuts help (shift + /)
            if (event.shiftKey) {
              event.preventDefault()
              // Could trigger a shortcuts modal here
            }
            break
        }
      }
    },
    [router, onNewEntry, onQuickSearch]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  return {
    shortcuts: [
      { key: 'N', description: 'New entry' },
      { key: 'D', description: 'Dashboard' },
      { key: 'I', description: 'Income' },
      { key: 'E', description: 'Expenses' },
      { key: 'S', description: 'Savings' },
      { key: '⌘K', description: 'Quick search' },
    ],
  }
}
