import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { dashboardQuerySchema } from '@/lib/validations'
import { getMonthsList } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both from and to parameters are required' },
        { status: 400 }
      )
    }

    const validation = dashboardQuerySchema.safeParse({ from, to })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const months = getMonthsList(from, to)

    // Get all income entries in range
    const incomeEntries = await prisma.incomeEntry.findMany({
      where: {
        userId: user.id,
        month: { in: months },
      },
      include: {
        source: {
          select: { name: true },
        },
      },
    })

    // Get all expense entries in range
    const expenseEntries = await prisma.expenseEntry.findMany({
      where: {
        userId: user.id,
        month: { in: months },
      },
      include: {
        vertical: {
          select: { name: true },
        },
      },
    })

    // Get all savings entries in range
    const savingsEntries = await prisma.savingsEntry.findMany({
      where: {
        userId: user.id,
        month: { in: months },
      },
      include: {
        instrument: {
          select: { name: true, category: true },
        },
      },
    })

    // Calculate totals
    const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0)
    const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amount, 0)
    const totalSavings = savingsEntries.reduce((sum, e) => sum + e.amount, 0)
    const netCashFlow = totalIncome - totalExpenses - totalSavings
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

    // Monthly breakdown
    const monthlyData = months.map((month) => {
      const monthIncome = incomeEntries
        .filter((e) => e.month === month)
        .reduce((sum, e) => sum + e.amount, 0)
      const monthExpenses = expenseEntries
        .filter((e) => e.month === month)
        .reduce((sum, e) => sum + e.amount, 0)
      const monthSavings = savingsEntries
        .filter((e) => e.month === month)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        month,
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthSavings,
        netCashFlow: monthIncome - monthExpenses - monthSavings,
      }
    })

    // Income breakdown by source
    const incomeBySource = incomeEntries.reduce(
      (acc, entry) => {
        const sourceName = entry.source.name
        acc[sourceName] = (acc[sourceName] || 0) + entry.amount
        return acc
      },
      {} as Record<string, number>
    )

    // Expense breakdown by vertical
    const expensesByVertical = expenseEntries.reduce(
      (acc, entry) => {
        const verticalName = entry.vertical.name
        acc[verticalName] = (acc[verticalName] || 0) + entry.amount
        return acc
      },
      {} as Record<string, number>
    )

    // Savings breakdown by category
    const savingsByCategory = savingsEntries.reduce(
      (acc, entry) => {
        const category = entry.instrument.category
        acc[category] = (acc[category] || 0) + entry.amount
        return acc
      },
      {} as Record<string, number>
    )

    // Savings breakdown by instrument
    const savingsByInstrument = savingsEntries.reduce(
      (acc, entry) => {
        const instrumentName = entry.instrument.name
        acc[instrumentName] = (acc[instrumentName] || 0) + entry.amount
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings,
        netCashFlow,
        savingsRate: Math.round(savingsRate * 100) / 100,
        expenseRatio: Math.round(expenseRatio * 100) / 100,
      },
      monthlyData,
      breakdowns: {
        incomeBySource: Object.entries(incomeBySource).map(([name, amount]) => ({
          name,
          amount,
        })),
        expensesByVertical: Object.entries(expensesByVertical).map(
          ([name, amount]) => ({ name, amount })
        ),
        savingsByCategory: Object.entries(savingsByCategory).map(
          ([category, amount]) => ({ category, amount })
        ),
        savingsByInstrument: Object.entries(savingsByInstrument).map(
          ([name, amount]) => ({ name, amount })
        ),
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
