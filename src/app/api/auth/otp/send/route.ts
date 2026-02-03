import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail, generateOTP } from '@/lib/email'
import { z } from 'zod'

const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// OTP expires in 10 minutes
const OTP_EXPIRY_MINUTES = 10
// Rate limit: max 3 OTP requests per email per hour
const MAX_REQUESTS_PER_HOUR = 3

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = sendOTPSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = validation.data
    const normalizedEmail = email.toLowerCase()

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Rate limiting: check recent OTP requests
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = await prisma.emailVerification.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentRequests >= MAX_REQUESTS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Delete any existing unverified OTPs for this email
    await prisma.emailVerification.deleteMany({
      where: {
        email: normalizedEmail,
        verified: false,
      },
    })

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP in database
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt,
      },
    })

    // Send OTP email
    const emailSent = await sendOTPEmail(normalizedEmail, otp)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification code sent to your email',
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
