'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMonth } from '@/lib/utils'

interface MonthSelectorProps {
  month: string
  onChange: (month: string) => void
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  const goToPreviousMonth = () => {
    const [year, monthNum] = month.split('-').map(Number)
    const date = new Date(year, monthNum - 2, 1)
    onChange(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const goToNextMonth = () => {
    const [year, monthNum] = month.split('-').map(Number)
    const date = new Date(year, monthNum, 1)
    onChange(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    onChange(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    )
  }

  return (
    <div className="flex items-center gap-1 bg-card rounded-xl border border-border p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg hover:bg-muted"
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        className="min-w-[140px] sm:min-w-[160px] h-9 rounded-lg hover:bg-muted font-medium text-sm"
        onClick={goToCurrentMonth}
      >
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        {formatMonth(month)}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg hover:bg-muted"
        onClick={goToNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
