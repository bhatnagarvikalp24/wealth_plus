import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateSavingsEntrySchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.savingsEntry.findFirst({
      where: { id: params.id, userId: user.id },
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

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching savings entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings entry' },
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
    const existingEntry = await prisma.savingsEntry.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateSavingsEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { month, instrumentId, amount, notes } = validation.data

    // If instrumentId is provided, verify it exists
    if (instrumentId) {
      const instrument = await prisma.savingsInstrument.findUnique({
        where: { id: instrumentId },
      })

      if (!instrument) {
        return NextResponse.json(
          { error: 'Invalid savings instrument' },
          { status: 400 }
        )
      }
    }

    const entry = await prisma.savingsEntry.update({
      where: { id: params.id },
      data: {
        ...(month && { month }),
        ...(instrumentId && { instrumentId }),
        ...(amount !== undefined && { amount }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error updating savings entry:', error)
    return NextResponse.json(
      { error: 'Failed to update savings entry' },
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
    const existingEntry = await prisma.savingsEntry.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await prisma.savingsEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting savings entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete savings entry' },
      { status: 500 }
    )
  }
}
