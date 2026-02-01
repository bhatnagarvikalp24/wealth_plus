import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has any income sources or expense verticals
    // If they have any, onboarding is considered complete
    const [incomeSourceCount, expenseVerticalCount] = await Promise.all([
      prisma.incomeSource.count({
        where: { userId: session.user.id },
      }),
      prisma.expenseVertical.count({
        where: { userId: session.user.id },
      }),
    ])

    const onboardingCompleted = incomeSourceCount > 0 || expenseVerticalCount > 0

    return NextResponse.json({ onboardingCompleted })
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}

export async function POST() {
  // This is now a no-op since onboarding completion is determined by data presence
  return NextResponse.json({ success: true })
}
