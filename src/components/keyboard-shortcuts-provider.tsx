'use client'

import { ReactNode, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface QuickSearchContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const QuickSearchContext = createContext<QuickSearchContextType | null>(null)

export function useQuickSearch() {
  const context = useContext(QuickSearchContext)
  if (!context) {
    throw new Error('useQuickSearch must be used within KeyboardShortcutsProvider')
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)

  // Determine the "new entry" action based on current page
  const handleNewEntry = () => {
    // Dispatch a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('keyboard-new-entry'))
  }

  const handleQuickSearch = () => {
    setQuickSearchOpen(true)
  }

  const { shortcuts } = useKeyboardShortcuts({
    onNewEntry: handleNewEntry,
    onQuickSearch: handleQuickSearch,
    enabled: true,
  })

  return (
    <QuickSearchContext.Provider value={{ isOpen: quickSearchOpen, setIsOpen: setQuickSearchOpen }}>
      {children}

      {/* Quick Search Dialog - Placeholder for future implementation */}
      <Dialog open={quickSearchOpen} onOpenChange={setQuickSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Quick Navigation
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Press a key to navigate:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    onClick={() => {
                      setQuickSearchOpen(false)
                      if (shortcut.key === 'D') router.push('/dashboard')
                      else if (shortcut.key === 'I') router.push('/income')
                      else if (shortcut.key === 'E') router.push('/expenses')
                      else if (shortcut.key === 'S') router.push('/savings')
                      else if (shortcut.key === 'N') handleNewEntry()
                    }}
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-background border rounded">
                      {shortcut.key}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </QuickSearchContext.Provider>
  )
}
