import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateExpenseEntrySchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.expenseEntry.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        vertical: {
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
    console.error('Error fetching expense entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense entry' },
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
    const existingEntry = await prisma.expenseEntry.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateExpenseEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { month, verticalId, amount, notes } = validation.data

    // If verticalId is provided, verify it belongs to user
    if (verticalId) {
      const vertical = await prisma.expenseVertical.findFirst({
        where: { id: verticalId, userId: user.id },
      })

      if (!vertical) {
        return NextResponse.json(
          { error: 'Invalid expense vertical' },
          { status: 400 }
        )
      }
    }

    const entry = await prisma.expenseEntry.update({
      where: { id: params.id },
      data: {
        ...(month && { month }),
        ...(verticalId && { verticalId }),
        ...(amount !== undefined && { amount }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error updating expense entry:', error)
    return NextResponse.json(
      { error: 'Failed to update expense entry' },
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
    const existingEntry = await prisma.expenseEntry.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await prisma.expenseEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense entry' },
      { status: 500 }
    )
  }
}
