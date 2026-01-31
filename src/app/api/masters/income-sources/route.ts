import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createIncomeSourceSchema } from '@/lib/validations'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sources = await prisma.incomeSource.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { incomeEntries: true },
        },
      },
    })

    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Error fetching income sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch income sources' },
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
    const validation = createIncomeSourceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Check if name already exists for this user
    const existing = await prisma.incomeSource.findFirst({
      where: { name, userId: user.id },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Income source with this name already exists' },
        { status: 400 }
      )
    }

    const source = await prisma.incomeSource.create({
      data: {
        name,
        userId: user.id,
        isDefault: false,
      },
    })

    return NextResponse.json({ source }, { status: 201 })
  } catch (error) {
    console.error('Error creating income source:', error)
    return NextResponse.json(
      { error: 'Failed to create income source' },
      { status: 500 }
    )
  }
}
