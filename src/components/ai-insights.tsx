'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Target,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MonthlyInsight {
  summary: string
  highlights: string[]
  recommendations: string[]
  savingsRate: number
  topExpenseCategory: string
  trend: 'improving' | 'stable' | 'needs_attention'
}

interface AIInsightsProps {
  month?: string
}

export function AIInsights({ month }: AIInsightsProps) {
  const [insights, setInsights] = useState<MonthlyInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const currentMonth = month || new Date().toISOString().slice(0, 7)
      const response = await fetch(`/api/ai/insights?month=${currentMonth}`)
      const data = await response.json()
      if (data.error && !data.insights) {
        setError(data.error)
      } else {
        setInsights(data.insights)
      }
    } catch (err) {
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [month])

  const getTrendIcon = () => {
    if (!insights) return null
    switch (insights.trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />
      case 'needs_attention':
        return <TrendingDown className="h-5 w-5 text-red-500" />
      default:
        return <Minus className="h-5 w-5 text-amber-500" />
    }
  }

  const getTrendLabel = () => {
    if (!insights) return ''
    switch (insights.trend) {
      case 'improving':
        return 'Improving'
      case 'needs_attention':
        return 'Needs Attention'
      default:
        return 'Stable'
    }
  }

  const getTrendColor = () => {
    if (!insights) return 'text-muted-foreground'
    switch (insights.trend) {
      case 'improving':
        return 'text-emerald-600 dark:text-emerald-400'
      case 'needs_attention':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-amber-600 dark:text-amber-400'
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-fuchsia-500/10 border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !insights) {
    return (
      <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-fuchsia-500/10 border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  return (
    <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-fuchsia-500/10 border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Insights
          </CardTitle>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="hidden sm:inline">{getTrendLabel()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-foreground/90 leading-relaxed">
          {insights.summary}
        </p>

        {/* Key Stats */}
        <div className="flex gap-4 py-2">
          <div className="flex-1 text-center p-3 bg-card/50 rounded-lg">
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {insights.savingsRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Savings Rate</p>
          </div>
          <div className="flex-1 text-center p-3 bg-card/50 rounded-lg">
            <p className="text-sm font-semibold text-foreground truncate">
              {insights.topExpenseCategory}
            </p>
            <p className="text-xs text-muted-foreground">Top Expense</p>
          </div>
        </div>

        {/* Highlights */}
        {insights.highlights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-foreground">Key Highlights</span>
            </div>
            <ul className="space-y-1.5">
              {insights.highlights.slice(0, 3).map((highlight, index) => (
                <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-violet-500 mt-1">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">Recommendations</span>
            </div>
            <ul className="space-y-1.5">
              {insights.recommendations.slice(0, 2).map((rec, index) => (
                <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-500/10"
          onClick={fetchInsights}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Insights
        </Button>
      </CardContent>
    </Card>
  )
}
