import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-')
  const date = new Date(parseInt(year), parseInt(monthNum) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthRange(months: number): { from: string; to: string } {
  const now = new Date()
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const fromDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}`

  return { from, to }
}

export function getMonthsList(from: string, to: string): string[] {
  const months: string[] = []
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)

  let currentYear = fromYear
  let currentMonth = fromMonth

  while (currentYear < toYear || (currentYear === toYear && currentMonth <= toMonth)) {
    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return months
}

export function savingsCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    FD_RD: 'Bank Deposits',
    NPS_PPF: 'Retirement & Tax',
    STOCKS_ETFS: 'Equities',
    MF: 'Mutual Funds',
  }
  return labels[category] || category
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 100) / 100
}
