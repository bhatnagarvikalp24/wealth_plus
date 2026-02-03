'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIInsights } from '@/components/ai-insights'
import { SpendingAlerts } from '@/components/spending-alerts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, getMonthRange, savingsCategoryLabel } from '@/lib/utils'

interface DashboardData {
  summary: {
    totalIncome: number
    totalExpenses: number
    totalSavings: number
    netCashFlow: number
    savingsRate: number
    expenseRatio: number
  }
  monthlyData: Array<{
    month: string
    income: number
    expenses: number
    savings: number
    netCashFlow: number
  }>
  breakdowns: {
    incomeBySource: Array<{ name: string; amount: number }>
    expensesByVertical: Array<{ name: string; amount: number }>
    savingsByCategory: Array<{ category: string; amount: number }>
    savingsByInstrument: Array<{ name: string; amount: number }>
  }
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [range, setRange] = useState('6')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [range])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { from, to } = getMonthRange(parseInt(range))
      const response = await fetch(`/api/dashboard?from=${from}&to=${to}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const result = await response.json()
      setData(result)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  const exportSummary = () => {
    const { from, to } = getMonthRange(parseInt(range))
    window.open(`/api/export?month=${to}&type=summary`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" description="Your financial overview" />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading your financial data...</p>
          </div>
        </div>
      </div>
    )
  }

  const hasNoData =
    !data ||
    (data.summary.totalIncome === 0 &&
      data.summary.totalExpenses === 0 &&
      data.summary.totalSavings === 0)

  if (hasNoData) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" description="Your financial overview" />
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiggyBank className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No data yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start by adding your income, expenses, or savings to see your
              financial overview here.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={() => (window.location.href = '/income')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Add Income
              </Button>
              <Button
                onClick={() => (window.location.href = '/expenses')}
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { summary, monthlyData, breakdowns } = data

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" description="Your financial overview" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto bg-muted/30">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px] sm:w-[180px] bg-card border-border">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={exportSummary}
            className="bg-card text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalIncome)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-red-500/10 dark:bg-red-500/20 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
                <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                  <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Savings</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalSavings)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div
                  className={`p-1.5 sm:p-2 rounded-lg ${summary.netCashFlow >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}
                >
                  {summary.netCashFlow >= 0 ? (
                    <TrendingUp
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${summary.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                    />
                  ) : (
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Net Cash Flow</p>
              <p
                className={`text-lg sm:text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(summary.netCashFlow)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-violet-500/10 dark:bg-violet-500/20 rounded-lg">
                  <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Savings Rate</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {summary.savingsRate}%
              </p>
              <p className="text-xs text-muted-foreground/70">of income</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Expense Ratio</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {summary.expenseRatio}%
              </p>
              <p className="text-xs text-muted-foreground/70">of income</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <AIInsights month={monthlyData[monthlyData.length - 1]?.month} />
          <SpendingAlerts month={monthlyData[monthlyData.length - 1]?.month} />
        </div>

        {/* Trend Chart */}
        <Card className="bg-card border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[280px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                    name="Expenses"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#savingsGradient)"
                    name="Savings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Expenses by Category */}
          <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                Expenses by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[250px] sm:h-[280px]">
                {breakdowns.expensesByVertical.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdowns.expensesByVertical}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {breakdowns.expensesByVertical.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No expense data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income by Source */}
          <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                Income by Source
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[250px] sm:h-[280px]">
                {breakdowns.incomeBySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdowns.incomeBySource}
                      layout="vertical"
                      margin={{ left: 0, right: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={70}
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No income data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Savings by Category */}
          <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                Savings by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[250px] sm:h-[280px]">
                {breakdowns.savingsByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdowns.savingsByCategory.map((item) => ({
                        ...item,
                        name: savingsCategoryLabel(item.category),
                      }))}
                      margin={{ left: 0, right: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        angle={-15}
                        textAnchor="end"
                        height={50}
                        interval={0}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No savings data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
