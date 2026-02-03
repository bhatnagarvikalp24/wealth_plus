import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

// Max verification attempts before OTP is invalidated
const MAX_ATTEMPTS = 5

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = verifyOTPSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, otp } = validation.data
    const normalizedEmail = email.toLowerCase()

    // Find the most recent unverified OTP for this email
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'No pending verification found. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      })
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check attempts
    if (verification.attempts >= MAX_ATTEMPTS) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      })
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (verification.otp !== otp) {
      // Increment attempts
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      })

      const remainingAttempts = MAX_ATTEMPTS - verification.attempts - 1
      return NextResponse.json(
        {
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        },
        { status: 400 }
      )
    }

    // Mark as verified
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    })

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
