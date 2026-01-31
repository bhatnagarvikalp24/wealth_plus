import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { exportQuerySchema } from '@/lib/validations'
import { savingsCategoryLabel } from '@/lib/utils'

function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function arrayToCsv(headers: string[], rows: (string | number | null)[][]): string {
  const headerRow = headers.map(escapeCsvField).join(',')
  const dataRows = rows.map((row) => row.map(escapeCsvField).join(','))
  return [headerRow, ...dataRows].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const type = searchParams.get('type')

    if (!month || !type) {
      return NextResponse.json(
        { error: 'Both month and type parameters are required' },
        { status: 400 }
      )
    }

    const validation = exportQuerySchema.safeParse({ month, type })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    let csv = ''
    let filename = ''

    if (type === 'income') {
      const entries = await prisma.incomeEntry.findMany({
        where: { userId: user.id, month },
        include: { source: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })

      const headers = ['Month', 'Source', 'Amount', 'Notes', 'Created At']
      const rows = entries.map((e) => [
        e.month,
        e.source.name,
        e.amount,
        e.notes,
        e.createdAt.toISOString(),
      ])
      csv = arrayToCsv(headers, rows)
      filename = `income_${month}.csv`
    } else if (type === 'expenses') {
      const entries = await prisma.expenseEntry.findMany({
        where: { userId: user.id, month },
        include: { vertical: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })

      const headers = ['Month', 'Vertical', 'Amount', 'Notes', 'Created At']
      const rows = entries.map((e) => [
        e.month,
        e.vertical.name,
        e.amount,
        e.notes,
        e.createdAt.toISOString(),
      ])
      csv = arrayToCsv(headers, rows)
      filename = `expenses_${month}.csv`
    } else if (type === 'savings') {
      const entries = await prisma.savingsEntry.findMany({
        where: { userId: user.id, month },
        include: { instrument: { select: { name: true, category: true } } },
        orderBy: { createdAt: 'desc' },
      })

      const headers = ['Month', 'Category', 'Instrument', 'Amount', 'Notes', 'Created At']
      const rows = entries.map((e) => [
        e.month,
        savingsCategoryLabel(e.instrument.category),
        e.instrument.name,
        e.amount,
        e.notes,
        e.createdAt.toISOString(),
      ])
      csv = arrayToCsv(headers, rows)
      filename = `savings_${month}.csv`
    } else if (type === 'summary') {
      const [incomeEntries, expenseEntries, savingsEntries] = await Promise.all([
        prisma.incomeEntry.findMany({
          where: { userId: user.id, month },
          include: { source: { select: { name: true } } },
        }),
        prisma.expenseEntry.findMany({
          where: { userId: user.id, month },
          include: { vertical: { select: { name: true } } },
        }),
        prisma.savingsEntry.findMany({
          where: { userId: user.id, month },
          include: { instrument: { select: { name: true, category: true } } },
        }),
      ])

      const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0)
      const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amount, 0)
      const totalSavings = savingsEntries.reduce((sum, e) => sum + e.amount, 0)
      const netCashFlow = totalIncome - totalExpenses - totalSavings
      const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
      const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

      const headers = ['Metric', 'Value']
      const rows: (string | number)[][] = [
        ['Month', month],
        ['Total Income', totalIncome],
        ['Total Expenses', totalExpenses],
        ['Total Savings', totalSavings],
        ['Net Cash Flow', netCashFlow],
        ['Savings Rate (%)', Math.round(savingsRate * 100) / 100],
        ['Expense Ratio (%)', Math.round(expenseRatio * 100) / 100],
        ['', ''],
        ['Income Breakdown', ''],
      ]

      // Income breakdown
      const incomeBySource = incomeEntries.reduce(
        (acc, e) => {
          acc[e.source.name] = (acc[e.source.name] || 0) + e.amount
          return acc
        },
        {} as Record<string, number>
      )
      Object.entries(incomeBySource).forEach(([name, amount]) => {
        rows.push([`  ${name}`, amount])
      })

      rows.push(['', ''])
      rows.push(['Expense Breakdown', ''])

      // Expense breakdown
      const expensesByVertical = expenseEntries.reduce(
        (acc, e) => {
          acc[e.vertical.name] = (acc[e.vertical.name] || 0) + e.amount
          return acc
        },
        {} as Record<string, number>
      )
      Object.entries(expensesByVertical).forEach(([name, amount]) => {
        rows.push([`  ${name}`, amount])
      })

      rows.push(['', ''])
      rows.push(['Savings Breakdown', ''])

      // Savings breakdown
      const savingsByCategory = savingsEntries.reduce(
        (acc, e) => {
          const cat = savingsCategoryLabel(e.instrument.category)
          acc[cat] = (acc[cat] || 0) + e.amount
          return acc
        },
        {} as Record<string, number>
      )
      Object.entries(savingsByCategory).forEach(([name, amount]) => {
        rows.push([`  ${name}`, amount])
      })

      csv = arrayToCsv(headers, rows)
      filename = `summary_${month}.csv`
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
