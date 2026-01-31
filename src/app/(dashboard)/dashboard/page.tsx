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
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
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
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading your financial data...</p>
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
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiggyBank className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No data yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start by adding your income, expenses, or savings to see your
              financial overview here.
            </p>
            <div className="flex gap-3 justify-center">
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

      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <Calendar className="h-5 w-5 text-gray-500" />
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200">
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
            className="bg-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalIncome)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PiggyBank className="h-5 w-5 text-blue-600" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Savings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalSavings)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-lg ${summary.netCashFlow >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}
                >
                  {summary.netCashFlow >= 0 ? (
                    <TrendingUp
                      className={`h-5 w-5 ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Net Cash Flow</p>
              <p
                className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatCurrency(summary.netCashFlow)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <PiggyBank className="h-5 w-5 text-violet-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Savings Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.savingsRate}%
              </p>
              <p className="text-xs text-gray-400">of income</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Expense Ratio</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.expenseRatio}%
              </p>
              <p className="text-xs text-gray-400">of income</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonthLabel}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses by Category */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Expenses by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {breakdowns.expensesByVertical.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdowns.expensesByVertical}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
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
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No expense data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income by Source */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Income by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {breakdowns.incomeBySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdowns.incomeBySource}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={70}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No income data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Savings by Category */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Savings by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {breakdowns.savingsByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdowns.savingsByCategory.map((item) => ({
                        ...item,
                        name: savingsCategoryLabel(item.category),
                      }))}
                      margin={{ left: 10, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
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
