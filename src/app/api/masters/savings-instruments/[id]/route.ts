import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createSavingsInstrumentSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify instrument exists
    const existingInstrument = await prisma.savingsInstrument.findUnique({
      where: { id: params.id },
    })

    if (!existingInstrument) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 })
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

    // Check if name already exists in this category for another instrument
    const duplicate = await prisma.savingsInstrument.findFirst({
      where: { name, category, NOT: { id: params.id } },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Savings instrument with this name already exists in this category' },
        { status: 400 }
      )
    }

    const instrument = await prisma.savingsInstrument.update({
      where: { id: params.id },
      data: { name, category },
    })

    return NextResponse.json({ instrument })
  } catch (error) {
    console.error('Error updating savings instrument:', error)
    return NextResponse.json(
      { error: 'Failed to update savings instrument' },
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

    // Verify instrument exists
    const existingInstrument = await prisma.savingsInstrument.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { savingsEntries: true },
        },
      },
    })

    if (!existingInstrument) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 })
    }

    // Check if instrument is in use
    if (existingInstrument._count.savingsEntries > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${existingInstrument._count.savingsEntries} entries are using this instrument. Reassign them first.`,
        },
        { status: 400 }
      )
    }

    await prisma.savingsInstrument.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Instrument deleted successfully' })
  } catch (error) {
    console.error('Error deleting savings instrument:', error)
    return NextResponse.json(
      { error: 'Failed to delete savings instrument' },
      { status: 500 }
    )
  }
}
