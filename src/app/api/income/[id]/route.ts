import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateIncomeEntrySchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.incomeEntry.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        source: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching income entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch income entry' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify entry exists and belongs to user
    const existingEntry = await prisma.incomeEntry.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateIncomeEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { month, sourceId, amount, notes } = validation.data

    // If sourceId is provided, verify it belongs to user
    if (sourceId) {
      const source = await prisma.incomeSource.findFirst({
        where: { id: sourceId, userId: user.id },
      })

      if (!source) {
        return NextResponse.json(
          { error: 'Invalid income source' },
          { status: 400 }
        )
      }
    }

    const entry = await prisma.incomeEntry.update({
      where: { id: params.id },
      data: {
        ...(month && { month }),
        ...(sourceId && { sourceId }),
        ...(amount !== undefined && { amount }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error updating income entry:', error)
    return NextResponse.json(
      { error: 'Failed to update income entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify entry exists and belongs to user
    const existingEntry = await prisma.incomeEntry.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await prisma.incomeEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting income entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete income entry' },
      { status: 500 }
    )
  }
}
