import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

// Security constants
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const ATTEMPT_WINDOW_MINUTES = 15

async function logLoginAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  reason?: string
) {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        userId,
        success,
        reason,
        // Note: IP and userAgent would need to be passed from the request
      },
    })
  } catch (error) {
    console.error('Failed to log login attempt:', error)
  }
}

async function checkAccountLockout(email: string): Promise<{ locked: boolean; minutesRemaining?: number }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { lockedUntil: true, failedLoginAttempts: true },
  })

  if (!user) {
    return { locked: false }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesRemaining = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
    )
    return { locked: true, minutesRemaining }
  }

  return { locked: false }
}

async function handleFailedLogin(email: string, userId: string | null) {
  if (!userId) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  })

  if (!user) return

  const newAttempts = user.failedLoginAttempts + 1
  const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : null,
    },
  })
}

async function handleSuccessfulLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  })
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const email = credentials.email.toLowerCase()

        // Check if account is locked
        const lockStatus = await checkAccountLockout(email)
        if (lockStatus.locked) {
          await logLoginAttempt(email, null, false, 'account_locked')
          throw new Error(`Account is temporarily locked. Please try again in ${lockStatus.minutesRemaining} minutes.`)
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          await logLoginAttempt(email, null, false, 'invalid_email')
          // Use generic message to prevent email enumeration
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          await handleFailedLogin(email, user.id)
          await logLoginAttempt(email, user.id, false, 'invalid_password')

          // Check if this attempt caused a lockout
          const newLockStatus = await checkAccountLockout(email)
          if (newLockStatus.locked) {
            throw new Error(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`)
          }

          throw new Error('Invalid email or password')
        }

        // Successful login
        await handleSuccessfulLogin(user.id)
        await logLoginAttempt(email, user.id, true, 'success')

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user?.id) {
    return null
  }
  return session.user
}
