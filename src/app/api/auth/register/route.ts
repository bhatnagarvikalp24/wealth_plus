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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer,
      },
    })

    // Create default income sources for the user
    const defaultIncomeSources = [
      'Salary',
      'Freelance',
      'Business',
      'Interest',
      'Dividends',
      'Rental',
      'Other',
    ]

    await prisma.incomeSource.createMany({
      data: defaultIncomeSources.map((name) => ({
        name,
        userId: user.id,
        isDefault: true,
      })),
    })

    // Create default expense verticals for the user
    const defaultExpenseVerticals = [
      'Rent/Home',
      'Groceries',
      'Eating Out',
      'Travel',
      'Utilities',
      'Subscriptions',
      'Shopping',
      'Health',
      'Insurance',
      'Family',
      'EMI/Debt',
      'Misc',
    ]

    await prisma.expenseVertical.createMany({
      data: defaultExpenseVerticals.map((name) => ({
        name,
        userId: user.id,
        isDefault: true,
      })),
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
