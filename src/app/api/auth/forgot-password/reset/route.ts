import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, securityAnswer, newPassword } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        securityAnswer: true,
      },
    })

    if (!user || !user.securityAnswer) {
      return NextResponse.json(
        { error: 'Invalid email or security question not set' },
        { status: 404 }
      )
    }

    // Verify security answer (case-insensitive)
    const isAnswerCorrect = await compare(
      securityAnswer.toLowerCase().trim(),
      user.securityAnswer
    )

    if (!isAnswerCorrect) {
      return NextResponse.json(
        { error: 'Incorrect security answer' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
