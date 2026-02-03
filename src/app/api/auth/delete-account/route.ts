import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Delete all user data in order (respecting foreign key constraints)
    // The User model has onDelete: Cascade for most relations, but we'll be explicit

    // Delete income entries
    await prisma.incomeEntry.deleteMany({
      where: { userId },
    })

    // Delete expense entries
    await prisma.expenseEntry.deleteMany({
      where: { userId },
    })

    // Delete savings entries
    await prisma.savingsEntry.deleteMany({
      where: { userId },
    })

    // Delete income sources
    await prisma.incomeSource.deleteMany({
      where: { userId },
    })

    // Delete expense verticals
    await prisma.expenseVertical.deleteMany({
      where: { userId },
    })

    // Note: SavingsInstrument is a shared/global table, not user-specific

    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
