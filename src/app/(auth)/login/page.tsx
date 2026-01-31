'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TrendingUp, PiggyBank, Shield } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Error',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Wealth</span>
              <span className="text-2xl font-bold text-blue-200">Pulse</span>
            </div>
          </div>
          <p className="text-blue-100 text-lg max-w-md">
            Your personal finance companion for tracking income, expenses, and investments.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Track Your Growth</h3>
              <p className="text-blue-200 text-sm">Monitor income and expenses with beautiful charts and insights.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <PiggyBank className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Smart Savings</h3>
              <p className="text-blue-200 text-sm">Organize investments across FD, PPF, Stocks, and Mutual Funds.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Secure & Private</h3>
              <p className="text-blue-200 text-sm">Your financial data stays private and secure.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          &copy; {new Date().getFullYear()} WealthPulse. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">Wealth</span>
              <span className="text-2xl font-bold text-blue-600">Pulse</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 sm:h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11 sm:h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-gray-500 text-sm sm:text-base">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
