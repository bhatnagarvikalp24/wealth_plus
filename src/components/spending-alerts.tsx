'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface SpendingAlert {
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
  category?: string
}

interface SpendingAlertsProps {
  month?: string
  compact?: boolean
}

export function SpendingAlerts({ month, compact = false }: SpendingAlertsProps) {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [month])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const currentMonth = month || new Date().toISOString().slice(0, 7)
      const response = await fetch(`/api/ai/alerts?month=${currentMonth}`)
      const data = await response.json()
      setAlerts(data.alerts || [])
      setDismissed(new Set())
    } catch (err) {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (index: number) => {
    setDismissed(prev => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i))
  const displayAlerts = expanded ? visibleAlerts : visibleAlerts.slice(0, 3)

  const getAlertIcon = (type: SpendingAlert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertStyle = (type: SpendingAlert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-200 dark:border-amber-800'
      case 'success':
        return 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800'
      default:
        return 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-200 dark:border-blue-800'
    }
  }

  if (loading) {
    return (
      <Card className="bg-card border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Spending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className="bg-card border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Spending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 bg-emerald-500/10 rounded-full mb-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground">All Clear!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No spending alerts for this month
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    // Compact view for header or sidebar
    const warningCount = visibleAlerts.filter(a => a.type === 'warning').length
    const infoCount = visibleAlerts.filter(a => a.type === 'info').length
    const successCount = visibleAlerts.filter(a => a.type === 'success').length

    return (
      <div className="flex items-center gap-2">
        {warningCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{warningCount}</span>
          </div>
        )}
        {successCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{successCount}</span>
          </div>
        )}
        {infoCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full">
            <Info className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{infoCount}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-card border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Spending Alerts
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({visibleAlerts.length})
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.map((alert, index) => (
          <div
            key={index}
            className={`relative p-3 rounded-lg border ${getAlertStyle(alert.type)} transition-all`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100"
              onClick={() => dismissAlert(alerts.indexOf(alert))}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="flex items-start gap-3 pr-6">
              <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}

        {visibleAlerts.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : `Show ${visibleAlerts.length - 3} More`}
            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
