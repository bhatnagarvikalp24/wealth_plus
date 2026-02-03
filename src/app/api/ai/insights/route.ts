import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMonthlyInsights, type FinancialData } from '@/lib/ai'

// Force dynamic rendering - this route uses headers via getServerSession
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

    const userId = session.user.id

    // Get current month data
    const [incomeEntries, expenseEntries, savingsEntries] = await Promise.all([
      prisma.incomeEntry.findMany({
        where: { userId, month },
        include: { source: true },
      }),
      prisma.expenseEntry.findMany({
        where: { userId, month },
        include: { vertical: true },
      }),
      prisma.savingsEntry.findMany({
        where: { userId, month },
        include: { instrument: true },
      }),
    ])

    // Calculate totals
    const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0)
    const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amount, 0)
    const totalSavings = savingsEntries.reduce((sum, e) => sum + e.amount, 0)

    // Group by category
    const incomeBySource = Object.values(
      incomeEntries.reduce((acc, e) => {
        const name = e.source.name
        if (!acc[name]) acc[name] = { name, amount: 0 }
        acc[name].amount += e.amount
        return acc
      }, {} as Record<string, { name: string; amount: number }>)
    ).sort((a, b) => b.amount - a.amount)

    const expensesByCategory = Object.values(
      expenseEntries.reduce((acc, e) => {
        const name = e.vertical.name
        if (!acc[name]) acc[name] = { name, amount: 0 }
        acc[name].amount += e.amount
        return acc
      }, {} as Record<string, { name: string; amount: number }>)
    ).sort((a, b) => b.amount - a.amount)

    const savingsByInstrument = Object.values(
      savingsEntries.reduce((acc, e) => {
        const name = e.instrument.name
        if (!acc[name]) acc[name] = { name, category: e.instrument.category, amount: 0 }
        acc[name].amount += e.amount
        return acc
      }, {} as Record<string, { name: string; category: string; amount: number }>)
    ).sort((a, b) => b.amount - a.amount)

    // Get previous month data for comparison
    const prevMonth = new Date(month + '-01')
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevMonthStr = prevMonth.toISOString().slice(0, 7)

    const [prevIncomeEntries, prevExpenseEntries, prevSavingsEntries] = await Promise.all([
      prisma.incomeEntry.findMany({ where: { userId, month: prevMonthStr } }),
      prisma.expenseEntry.findMany({ where: { userId, month: prevMonthStr } }),
      prisma.savingsEntry.findMany({ where: { userId, month: prevMonthStr } }),
    ])

    const previousMonth = {
      totalIncome: prevIncomeEntries.reduce((sum, e) => sum + e.amount, 0),
      totalExpenses: prevExpenseEntries.reduce((sum, e) => sum + e.amount, 0),
      totalSavings: prevSavingsEntries.reduce((sum, e) => sum + e.amount, 0),
    }

    // Check if we have any data
    if (totalIncome === 0 && totalExpenses === 0 && totalSavings === 0) {
      return NextResponse.json({
        insights: {
          summary: 'No financial data recorded for this month yet. Start by adding your income, expenses, and savings!',
          highlights: ['Add your income sources', 'Track your expenses', 'Record your savings'],
          recommendations: ['Start by recording your monthly salary or income', 'Track daily expenses to understand spending patterns'],
          savingsRate: 0,
          topExpenseCategory: 'N/A',
          trend: 'stable',
        },
        data: {
          month,
          totalIncome,
          totalExpenses,
          totalSavings,
        },
      })
    }

    const financialData: FinancialData = {
      month,
      totalIncome,
      totalExpenses,
      totalSavings,
      incomeBySource,
      expensesByCategory,
      savingsByInstrument,
      previousMonth: previousMonth.totalIncome > 0 || previousMonth.totalExpenses > 0
        ? previousMonth
        : undefined,
    }

    const insights = await generateMonthlyInsights(financialData)

    return NextResponse.json({
      insights,
      data: {
        month,
        totalIncome,
        totalExpenses,
        totalSavings,
        incomeBySource,
        expensesByCategory,
        savingsByInstrument,
      },
    })
  } catch (error) {
    console.error('Insights error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Return a fallback response if AI fails
    return NextResponse.json({
      insights: {
        summary: 'Unable to generate AI insights at this time. Please try again later.',
        highlights: [],
        recommendations: [],
        savingsRate: 0,
        topExpenseCategory: 'N/A',
        trend: 'stable',
      },
      error: errorMessage.includes('API_KEY') ? 'OpenAI API key not configured' : errorMessage,
    })
  }
}
