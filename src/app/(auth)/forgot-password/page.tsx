'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, TrendingUp, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'security' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to verify email',
          variant: 'destructive',
        })
        return
      }

      setSecurityQuestion(result.securityQuestion)
      setStep('security')
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          securityAnswer,
          newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset password',
          variant: 'destructive',
        })
        return
      }

      setStep('success')
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900">Wealth</span>
            <span className="text-2xl font-bold text-emerald-600">Pulse</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {step === 'email' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                <p className="text-gray-500 mt-2">
                  Enter your email to verify your identity
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </>
          )}

          {step === 'security' && (
            <>
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('email')}
                  className="mb-4 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Security Question</h1>
                <p className="text-gray-500 mt-2">
                  Answer your security question to reset your password
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Your Question</Label>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-gray-800">{securityQuestion}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityAnswer" className="text-gray-700 font-medium">
                    Your Answer
                  </Label>
                  <Input
                    id="securityAnswer"
                    type="text"
                    placeholder="Enter your answer"
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Password Reset Successful!
                </h1>
                <p className="text-gray-500 mb-8">
                  You can now sign in with your new password
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Go to Sign In
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
