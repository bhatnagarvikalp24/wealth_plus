import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, securityQuestion, securityAnswer } = validation.data
    const normalizedEmail = email.toLowerCase()

    // Check if email is verified
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        verified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password and security answer
    const hashedPassword = await hash(password, 12)
    const hashedSecurityAnswer = await hash(securityAnswer.toLowerCase().trim(), 12)

    // Create user (onboarding wizard will set up categories)
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer,
      },
    })

    // Clean up verification records for this email
    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail },
    })

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
