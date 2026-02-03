'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TrendingUp, Check, ArrowLeft, Mail } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { SECURITY_QUESTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Step = 'email' | 'otp' | 'details'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpExpiry, setOtpExpiry] = useState(0)
  const [securityQuestion, setSecurityQuestion] = useState('')
  const otpInputs = useRef<(HTMLInputElement | null)[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  // Countdown timer for OTP
  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setInterval(() => {
        setOtpExpiry((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [otpExpiry])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendOTP = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send verification code',
          variant: 'destructive',
        })
        return
      }

      setOtpExpiry(result.expiresIn)
      setStep('otp')
      toast({
        title: 'Code Sent',
        description: 'Check your email for the verification code',
      })
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      const nextIndex = Math.min(index + digits.length, 5)
      otpInputs.current[nextIndex]?.focus()
    } else {
      const newOtp = [...otp]
      newOtp[index] = value.replace(/\D/g, '')
      setOtp(newOtp)
      if (value && index < 5) {
        otpInputs.current[index + 1]?.focus()
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter the complete 6-digit code',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Invalid verification code',
          variant: 'destructive',
        })
        return
      }

      setValue('email', email)
      setStep('details')
      toast({
        title: 'Email Verified',
        description: 'Please complete your registration',
      })
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
              <span className="text-2xl font-bold text-white">The</span>
              <span className="text-2xl font-bold text-emerald-200">Finlog</span>
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
          &copy; {new Date().getFullYear()} TheFinlog. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-muted/30 dark:bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">The</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Finlog</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8 border border-border">
            {/* Step 1: Email */}
            {step === 'email' && (
              <>
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create your account</h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">Enter your email to get started</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11 sm:h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    className="w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send Verification Code
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <>
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep('email')
                      setOtp(['', '', '', '', '', ''])
                    }}
                    className="mb-4 -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Verify your email</h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  {/* OTP Input */}
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border-2 border-border bg-muted/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-background transition-all outline-none text-foreground"
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  {otpExpiry > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Code expires in <span className="font-medium text-foreground">{formatTime(otpExpiry)}</span>
                    </p>
                  )}

                  <Button
                    onClick={handleVerifyOTP}
                    className="w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30"
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>

                  {/* Resend */}
                  <div className="text-center">
                    <button
                      onClick={handleSendOTP}
                      disabled={isLoading || otpExpiry > 540} // Allow resend after 1 minute
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Didn&apos;t receive the code? Resend
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Account Details */}
            {step === 'details' && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-emerald-500/10 rounded-full">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Email verified: {email}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Complete your profile</h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">Just a few more details</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="h-11 sm:h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                      {...register('name')}
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="h-11 sm:h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                      {...register('password')}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="securityQuestion" className="text-foreground font-medium">
                      Security Question
                    </Label>
                    <Select
                      value={securityQuestion}
                      onValueChange={(value) => {
                        setSecurityQuestion(value)
                        setValue('securityQuestion', value)
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11 sm:h-12 bg-muted/50 border-border focus:bg-background">
                        <SelectValue placeholder="Select a security question" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_QUESTIONS.map((question) => (
                          <SelectItem key={question} value={question}>
                            {question}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.securityQuestion && (
                      <p className="text-sm text-red-500">{errors.securityQuestion.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="securityAnswer" className="text-foreground font-medium">
                      Security Answer
                    </Label>
                    <Input
                      id="securityAnswer"
                      type="text"
                      placeholder="Your answer"
                      className="h-11 sm:h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                      {...register('securityAnswer')}
                      disabled={isLoading}
                    />
                    {errors.securityAnswer && (
                      <p className="text-sm text-red-500">{errors.securityAnswer.message}</p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Please remember your answer. It will be required for password recovery.
                    </p>
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
              </>
            )}

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-muted-foreground text-sm sm:text-base">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
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
