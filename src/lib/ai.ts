import OpenAI from 'openai'

// Lazy initialization to prevent build errors
let openaiClient: OpenAI | null = null

function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export interface FinancialData {
  month: string
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  incomeBySource: { name: string; amount: number }[]
  expensesByCategory: { name: string; amount: number }[]
  savingsByInstrument: { name: string; category: string; amount: number }[]
  previousMonth?: {
    totalIncome: number
    totalExpenses: number
    totalSavings: number
  }
}

export interface MonthlyInsight {
  summary: string
  highlights: string[]
  recommendations: string[]
  savingsRate: number
  topExpenseCategory: string
  trend: 'improving' | 'stable' | 'needs_attention'
}

export interface SpendingAlert {
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
  category?: string
}

export async function generateMonthlyInsights(data: FinancialData): Promise<MonthlyInsight> {
  const client = getClient()

  const prompt = `You are a helpful financial advisor analyzing a user's monthly financial data.
Provide insights in a friendly, encouraging tone. Be concise and actionable.

Financial Data for ${data.month}:
- Total Income: ₹${data.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${data.totalExpenses.toLocaleString('en-IN')}
- Total Savings: ₹${data.totalSavings.toLocaleString('en-IN')}

Income Breakdown:
${data.incomeBySource.map(s => `- ${s.name}: ₹${s.amount.toLocaleString('en-IN')}`).join('\n')}

Expense Breakdown:
${data.expensesByCategory.map(e => `- ${e.name}: ₹${e.amount.toLocaleString('en-IN')}`).join('\n')}

Savings Breakdown:
${data.savingsByInstrument.map(s => `- ${s.name} (${s.category}): ₹${s.amount.toLocaleString('en-IN')}`).join('\n')}

${data.previousMonth ? `
Previous Month Comparison:
- Previous Income: ₹${data.previousMonth.totalIncome.toLocaleString('en-IN')}
- Previous Expenses: ₹${data.previousMonth.totalExpenses.toLocaleString('en-IN')}
- Previous Savings: ₹${data.previousMonth.totalSavings.toLocaleString('en-IN')}
` : ''}

Please respond with a JSON object (no markdown, just pure JSON) with this structure:
{
  "summary": "A 2-3 sentence summary of the financial health this month",
  "highlights": ["3-4 key observations about the finances"],
  "recommendations": ["2-3 actionable suggestions for improvement"],
  "savingsRate": <number between 0-100 representing savings as % of income>,
  "topExpenseCategory": "name of highest expense category",
  "trend": "improving" | "stable" | "needs_attention"
}`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    return JSON.parse(content) as MonthlyInsight
  } catch {
    // Fallback if JSON parsing fails
    return {
      summary: 'Unable to generate insights at this time.',
      highlights: [],
      recommendations: [],
      savingsRate: data.totalIncome > 0 ? (data.totalSavings / data.totalIncome) * 100 : 0,
      topExpenseCategory: data.expensesByCategory[0]?.name || 'N/A',
      trend: 'stable',
    }
  }
}

export async function generateSpendingAlerts(data: FinancialData): Promise<SpendingAlert[]> {
  const alerts: SpendingAlert[] = []

  // Calculate savings rate
  const savingsRate = data.totalIncome > 0 ? (data.totalSavings / data.totalIncome) * 100 : 0
  const expenseRate = data.totalIncome > 0 ? (data.totalExpenses / data.totalIncome) * 100 : 0

  // Alert: Expenses exceed income
  if (data.totalExpenses > data.totalIncome && data.totalIncome > 0) {
    alerts.push({
      type: 'warning',
      title: 'Expenses Exceed Income',
      message: `You spent ₹${(data.totalExpenses - data.totalIncome).toLocaleString('en-IN')} more than you earned this month.`,
    })
  }

  // Alert: Low savings rate
  if (savingsRate < 10 && data.totalIncome > 0) {
    alerts.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: `Your savings rate is ${savingsRate.toFixed(1)}%. Consider aiming for at least 20%.`,
    })
  } else if (savingsRate >= 30) {
    alerts.push({
      type: 'success',
      title: 'Great Savings!',
      message: `Excellent! You're saving ${savingsRate.toFixed(1)}% of your income.`,
    })
  }

  // Alert: High expense ratio
  if (expenseRate > 80 && data.totalIncome > 0) {
    alerts.push({
      type: 'warning',
      title: 'High Expense Ratio',
      message: `${expenseRate.toFixed(1)}% of your income went to expenses. Review your spending categories.`,
    })
  }

  // Compare with previous month if available
  if (data.previousMonth) {
    const expenseChange = data.totalExpenses - data.previousMonth.totalExpenses
    const expenseChangePercent = data.previousMonth.totalExpenses > 0
      ? (expenseChange / data.previousMonth.totalExpenses) * 100
      : 0

    if (expenseChangePercent > 20) {
      alerts.push({
        type: 'warning',
        title: 'Spending Increased',
        message: `Your expenses increased by ${expenseChangePercent.toFixed(0)}% compared to last month.`,
      })
    } else if (expenseChangePercent < -10) {
      alerts.push({
        type: 'success',
        title: 'Spending Reduced',
        message: `Great job! You reduced expenses by ${Math.abs(expenseChangePercent).toFixed(0)}% this month.`,
      })
    }

    // Income change alert
    const incomeChange = data.totalIncome - data.previousMonth.totalIncome
    if (incomeChange > 0 && data.previousMonth.totalIncome > 0) {
      const incomeChangePercent = (incomeChange / data.previousMonth.totalIncome) * 100
      if (incomeChangePercent > 10) {
        alerts.push({
          type: 'success',
          title: 'Income Growth',
          message: `Your income grew by ${incomeChangePercent.toFixed(0)}% compared to last month!`,
        })
      }
    }
  }

  // Top spending category alert
  if (data.expensesByCategory.length > 0) {
    const topCategory = data.expensesByCategory[0]
    const topCategoryPercent = data.totalExpenses > 0
      ? (topCategory.amount / data.totalExpenses) * 100
      : 0

    if (topCategoryPercent > 40) {
      alerts.push({
        type: 'info',
        title: 'Top Spending Category',
        message: `${topCategory.name} accounts for ${topCategoryPercent.toFixed(0)}% of your expenses.`,
        category: topCategory.name,
      })
    }
  }

  // No savings alert
  if (data.totalSavings === 0 && data.totalIncome > 0) {
    alerts.push({
      type: 'warning',
      title: 'No Savings Recorded',
      message: 'Consider setting aside some amount for savings this month.',
    })
  }

  return alerts
}
