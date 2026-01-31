import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createExpenseVerticalSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify vertical exists and belongs to user
    const existingVertical = await prisma.expenseVertical.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingVertical) {
      return NextResponse.json({ error: 'Vertical not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = createExpenseVerticalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Check if name already exists for another vertical
    const duplicate = await prisma.expenseVertical.findFirst({
      where: { name, userId: user.id, NOT: { id: params.id } },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Expense vertical with this name already exists' },
        { status: 400 }
      )
    }

    const vertical = await prisma.expenseVertical.update({
      where: { id: params.id },
      data: { name },
    })

    return NextResponse.json({ vertical })
  } catch (error) {
    console.error('Error updating expense vertical:', error)
    return NextResponse.json(
      { error: 'Failed to update expense vertical' },
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

    // Verify vertical exists and belongs to user
    const existingVertical = await prisma.expenseVertical.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        _count: {
          select: { expenseEntries: true },
        },
      },
    })

    if (!existingVertical) {
      return NextResponse.json({ error: 'Vertical not found' }, { status: 404 })
    }

    // Check if vertical is in use
    if (existingVertical._count.expenseEntries > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${existingVertical._count.expenseEntries} entries are using this vertical. Reassign them first.`,
        },
        { status: 400 }
      )
    }

    await prisma.expenseVertical.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Vertical deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense vertical:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense vertical' },
      { status: 500 }
    )
  }
}
