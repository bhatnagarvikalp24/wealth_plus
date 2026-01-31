import { PrismaClient, SavingsCategory } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create default savings instruments with descriptive names
  const savingsInstruments = [
    // FD/RD Category - Bank Deposits
    { name: 'Bank Fixed Deposit', category: SavingsCategory.FD_RD },
    { name: 'Post Office Time Deposit', category: SavingsCategory.FD_RD },
    { name: 'Recurring Deposit', category: SavingsCategory.FD_RD },

    // NPS/PPF Category - Retirement & Tax Saving
    { name: 'National Pension Scheme (NPS)', category: SavingsCategory.NPS_PPF },
    { name: 'Public Provident Fund (PPF)', category: SavingsCategory.NPS_PPF },
    { name: 'Employee Provident Fund (EPF)', category: SavingsCategory.NPS_PPF },

    // Stocks/ETFs Category - Equities
    { name: 'Direct Equity (Stocks)', category: SavingsCategory.STOCKS_ETFS },
    { name: 'Index ETFs (Nifty/Sensex)', category: SavingsCategory.STOCKS_ETFS },
    { name: 'Gold ETF', category: SavingsCategory.STOCKS_ETFS },

    // Mutual Funds Category
    { name: 'Equity Mutual Funds (SIP)', category: SavingsCategory.MF },
    { name: 'Debt/Liquid Funds', category: SavingsCategory.MF },
    { name: 'ELSS Tax Saver Funds', category: SavingsCategory.MF },
  ]

  for (const instrument of savingsInstruments) {
    await prisma.savingsInstrument.upsert({
      where: {
        name_category: {
          name: instrument.name,
          category: instrument.category,
        },
      },
      update: {},
      create: {
        name: instrument.name,
        category: instrument.category,
        isDefault: true,
      },
    })
  }
  console.log('Created default savings instruments')

  // Create demo user
  const hashedPassword = await hash('demo123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  })
  console.log('Created demo user: demo@example.com / demo123')

  // Create default income sources for demo user
  const defaultIncomeSources = [
    'Monthly Salary',
    'Freelance Projects',
    'Business Income',
    'Bank Interest',
    'Stock Dividends',
    'Rental Income',
    'Other Income',
  ]

  const incomeSourcesMap: Record<string, string> = {}
  for (const name of defaultIncomeSources) {
    const source = await prisma.incomeSource.upsert({
      where: {
        name_userId: { name, userId: user.id },
      },
      update: {},
      create: {
        name,
        userId: user.id,
        isDefault: true,
      },
    })
    incomeSourcesMap[name] = source.id
  }
  console.log('Created default income sources')

  // Create default expense verticals for demo user
  const defaultExpenseVerticals = [
    'Rent & Housing',
    'Groceries & Essentials',
    'Dining & Food Delivery',
    'Transportation',
    'Utilities & Bills',
    'Subscriptions & OTT',
    'Shopping & Lifestyle',
    'Healthcare & Medicines',
    'Insurance Premiums',
    'Family & Gifts',
    'EMI & Loan Payments',
    'Miscellaneous',
  ]

  const expenseVerticalsMap: Record<string, string> = {}
  for (const name of defaultExpenseVerticals) {
    const vertical = await prisma.expenseVertical.upsert({
      where: {
        name_userId: { name, userId: user.id },
      },
      update: {},
      create: {
        name,
        userId: user.id,
        isDefault: true,
      },
    })
    expenseVerticalsMap[name] = vertical.id
  }
  console.log('Created default expense verticals')

  // Get savings instruments for demo data
  const allInstruments = await prisma.savingsInstrument.findMany()
  const instrumentsMap: Record<string, string> = {}
  for (const inst of allInstruments) {
    instrumentsMap[inst.name] = inst.id
  }

  // Generate demo data for last 4 months
  const now = new Date()
  const months: string[] = []
  for (let i = 3; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    )
  }

  console.log('Generating demo data for months:', months)

  // Demo income data
  const incomeData = [
    { source: 'Monthly Salary', baseAmount: 150000, variance: 0 },
    { source: 'Freelance Projects', baseAmount: 25000, variance: 15000 },
    { source: 'Bank Interest', baseAmount: 5000, variance: 2000 },
    { source: 'Stock Dividends', baseAmount: 8000, variance: 3000 },
  ]

  for (const month of months) {
    for (const income of incomeData) {
      const amount =
        income.baseAmount + Math.floor(Math.random() * income.variance)
      await prisma.incomeEntry.create({
        data: {
          month,
          amount,
          sourceId: incomeSourcesMap[income.source],
          userId: user.id,
          notes: `${income.source} for ${month}`,
        },
      })
    }
  }
  console.log('Created demo income entries')

  // Demo expense data
  const expenseData = [
    { vertical: 'Rent & Housing', baseAmount: 35000, variance: 0 },
    { vertical: 'Groceries & Essentials', baseAmount: 12000, variance: 3000 },
    { vertical: 'Dining & Food Delivery', baseAmount: 8000, variance: 4000 },
    { vertical: 'Transportation', baseAmount: 5000, variance: 10000 },
    { vertical: 'Utilities & Bills', baseAmount: 5000, variance: 2000 },
    { vertical: 'Subscriptions & OTT', baseAmount: 2500, variance: 500 },
    { vertical: 'Shopping & Lifestyle', baseAmount: 10000, variance: 8000 },
    { vertical: 'Healthcare & Medicines', baseAmount: 3000, variance: 2000 },
    { vertical: 'Insurance Premiums', baseAmount: 5000, variance: 0 },
    { vertical: 'EMI & Loan Payments', baseAmount: 15000, variance: 0 },
    { vertical: 'Miscellaneous', baseAmount: 5000, variance: 3000 },
  ]

  for (const month of months) {
    for (const expense of expenseData) {
      const amount =
        expense.baseAmount + Math.floor(Math.random() * expense.variance)
      if (amount > 0) {
        await prisma.expenseEntry.create({
          data: {
            month,
            amount,
            verticalId: expenseVerticalsMap[expense.vertical],
            userId: user.id,
            notes: `${expense.vertical} for ${month}`,
          },
        })
      }
    }
  }
  console.log('Created demo expense entries')

  // Demo savings data with new instrument names
  const savingsData = [
    { instrument: 'Equity Mutual Funds (SIP)', baseAmount: 25000, variance: 5000 },
    { instrument: 'Direct Equity (Stocks)', baseAmount: 15000, variance: 10000 },
    { instrument: 'Public Provident Fund (PPF)', baseAmount: 12500, variance: 0 },
    { instrument: 'National Pension Scheme (NPS)', baseAmount: 5000, variance: 0 },
    { instrument: 'Bank Fixed Deposit', baseAmount: 10000, variance: 5000 },
    { instrument: 'Index ETFs (Nifty/Sensex)', baseAmount: 8000, variance: 4000 },
  ]

  for (const month of months) {
    for (const savings of savingsData) {
      const amount =
        savings.baseAmount + Math.floor(Math.random() * savings.variance)
      if (amount > 0 && instrumentsMap[savings.instrument]) {
        await prisma.savingsEntry.create({
          data: {
            month,
            amount,
            instrumentId: instrumentsMap[savings.instrument],
            userId: user.id,
            notes: `${savings.instrument} investment for ${month}`,
          },
        })
      }
    }
  }
  console.log('Created demo savings entries')

  console.log('\n=================================')
  console.log('Seed completed successfully!')
  console.log('=================================')
  console.log('\nDemo user credentials:')
  console.log('Email: demo@example.com')
  console.log('Password: demo123')
  console.log('=================================\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
