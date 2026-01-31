import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createSavingsEntrySchema, monthSchema } from '@/lib/validations'

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

    const entries = await prisma.savingsEntry.findMany({
      where: whereClause,
      include: {
        instrument: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching savings entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings entries' },
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
    const validation = createSavingsEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { month, instrumentId, amount, notes } = validation.data

    // Verify the instrument exists
    const instrument = await prisma.savingsInstrument.findUnique({
      where: { id: instrumentId },
    })

    if (!instrument) {
      return NextResponse.json(
        { error: 'Invalid savings instrument' },
        { status: 400 }
      )
    }

    const entry = await prisma.savingsEntry.create({
      data: {
        month,
        instrumentId,
        amount,
        notes,
        userId: user.id,
      },
      include: {
        instrument: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating savings entry:', error)
    return NextResponse.json(
      { error: 'Failed to create savings entry' },
      { status: 500 }
    )
  }
}
