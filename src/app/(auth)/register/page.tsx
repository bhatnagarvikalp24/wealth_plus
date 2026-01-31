'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TrendingUp, Check } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create account',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Account created successfully. Please sign in.',
      })
      router.push('/login')
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

  const features = [
    'Track income from multiple sources',
    'Categorize expenses automatically',
    'Monitor investments across FD, PPF, Stocks & MF',
    'Beautiful charts and insights',
    'Export data anytime',
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 flex-col justify-between relative overflow-hidden">
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
              <span className="text-2xl font-bold text-emerald-200">Pulse</span>
            </div>
          </div>
          <p className="text-emerald-100 text-lg max-w-md">
            Start your journey to financial clarity today.
          </p>
        </div>

        <div className="relative z-10">
          <h3 className="text-white font-semibold text-lg mb-6">Everything you need to manage your finances:</h3>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-1 bg-emerald-400/20 rounded-full">
                  <Check className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="text-emerald-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-emerald-200 text-sm">
          &copy; {new Date().getFullYear()} WealthPulse. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">Wealth</span>
              <span className="text-2xl font-bold text-emerald-600">Pulse</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">Start tracking your finances in minutes</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="h-11 sm:h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  {...register('name')}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

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
                  placeholder="Minimum 6 characters"
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
                className="w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-gray-500 text-sm sm:text-base">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
