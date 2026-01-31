import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        securityQuestion: true,
      },
    })

    if (!user || !user.securityQuestion) {
      return NextResponse.json(
        { error: 'No account found with this email or no security question set' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      securityQuestion: user.securityQuestion,
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
