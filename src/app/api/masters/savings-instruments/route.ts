import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createSavingsInstrumentSchema } from '@/lib/validations'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instruments = await prisma.savingsInstrument.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { savingsEntries: true },
        },
      },
    })

    return NextResponse.json({ instruments })
  } catch (error) {
    console.error('Error fetching savings instruments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings instruments' },
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
    const validation = createSavingsInstrumentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, category } = validation.data

    // Check if name already exists in this category
    const existing = await prisma.savingsInstrument.findFirst({
      where: { name, category },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Savings instrument with this name already exists in this category' },
        { status: 400 }
      )
    }

    const instrument = await prisma.savingsInstrument.create({
      data: {
        name,
        category,
        isDefault: false,
      },
    })

    return NextResponse.json({ instrument }, { status: 201 })
  } catch (error) {
    console.error('Error creating savings instrument:', error)
    return NextResponse.json(
      { error: 'Failed to create savings instrument' },
      { status: 500 }
    )
  }
}
