import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createIncomeEntrySchema, monthSchema } from '@/lib/validations'

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

    const entries = await prisma.incomeEntry.findMany({
      where: whereClause,
      include: {
        source: {
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
    console.error('Error fetching income entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch income entries' },
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
    const validation = createIncomeEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { month, sourceId, amount, notes } = validation.data

    // Verify the source belongs to this user
    const source = await prisma.incomeSource.findFirst({
      where: { id: sourceId, userId: user.id },
    })

    if (!source) {
      return NextResponse.json(
        { error: 'Invalid income source' },
        { status: 400 }
      )
    }

    const entry = await prisma.incomeEntry.create({
      data: {
        month,
        sourceId,
        amount,
        notes,
        userId: user.id,
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating income entry:', error)
    return NextResponse.json(
      { error: 'Failed to create income entry' },
      { status: 500 }
    )
  }
}
