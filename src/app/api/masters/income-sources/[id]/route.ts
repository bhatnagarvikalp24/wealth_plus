import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createIncomeSourceSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify source exists and belongs to user
    const existingSource = await prisma.incomeSource.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingSource) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
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

    // Check if name already exists for another source
    const duplicate = await prisma.incomeSource.findFirst({
      where: { name, userId: user.id, NOT: { id: params.id } },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Income source with this name already exists' },
        { status: 400 }
      )
    }

    const source = await prisma.incomeSource.update({
      where: { id: params.id },
      data: { name },
    })

    return NextResponse.json({ source })
  } catch (error) {
    console.error('Error updating income source:', error)
    return NextResponse.json(
      { error: 'Failed to update income source' },
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

    // Verify source exists and belongs to user
    const existingSource = await prisma.incomeSource.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        _count: {
          select: { incomeEntries: true },
        },
      },
    })

    if (!existingSource) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    // Check if source is in use
    if (existingSource._count.incomeEntries > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${existingSource._count.incomeEntries} entries are using this source. Reassign them first.`,
        },
        { status: 400 }
      )
    }

    await prisma.incomeSource.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Source deleted successfully' })
  } catch (error) {
    console.error('Error deleting income source:', error)
    return NextResponse.json(
      { error: 'Failed to delete income source' },
      { status: 500 }
    )
  }
}
