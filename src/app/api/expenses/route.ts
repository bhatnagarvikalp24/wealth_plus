import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createExpenseEntrySchema, monthSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    const whereClause: { userId: string; month?: string } = {
      userId: user.id,
    }

    if (month) {
      const validation = monthSchema.safeParse(month)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid month format. Use YYYY-MM' },
          { status: 400 }
        )
      }
      whereClause.month = month
    }

    const entries = await prisma.expenseEntry.findMany({
      where: whereClause,
      include: {
        vertical: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching expense entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createExpenseEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { month, verticalId, amount, notes } = validation.data

    // Verify the vertical belongs to this user
    const vertical = await prisma.expenseVertical.findFirst({
      where: { id: verticalId, userId: user.id },
    })

    if (!vertical) {
      return NextResponse.json(
        { error: 'Invalid expense vertical' },
        { status: 400 }
      )
    }

    const entry = await prisma.expenseEntry.create({
      data: {
        month,
        verticalId,
        amount,
        notes,
        userId: user.id,
      },
      include: {
        vertical: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense entry:', error)
    return NextResponse.json(
      { error: 'Failed to create expense entry' },
      { status: 500 }
    )
  }
}
