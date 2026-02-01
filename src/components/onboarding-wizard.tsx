'use client'

import { useState } from 'react'
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface OnboardingWizardProps {
  onComplete: () => void
}

const DEFAULT_INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Investments']
const DEFAULT_EXPENSE_CATEGORIES = ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Healthcare']
const DEFAULT_SAVINGS_INSTRUMENTS = [
  { name: 'Fixed Deposit', category: 'FD_RD' },
  { name: 'PPF', category: 'NPS_PPF' },
  { name: 'Stocks', category: 'STOCKS_ETFS' },
  { name: 'Mutual Funds', category: 'MF' },
]

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Selected items for each category
  const [selectedIncome, setSelectedIncome] = useState<string[]>([])
  const [customIncome, setCustomIncome] = useState('')
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [customExpense, setCustomExpense] = useState('')
  const [selectedSavings, setSelectedSavings] = useState<typeof DEFAULT_SAVINGS_INSTRUMENTS>([])

  const steps = [
    {
      title: 'Welcome to The Finlog',
      subtitle: 'Your personal finance companion',
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Income Sources',
      subtitle: 'Where does your money come from?',
      icon: Wallet,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Expense Categories',
      subtitle: 'What do you spend on?',
      icon: CreditCard,
      color: 'from-red-500 to-rose-600',
    },
    {
      title: 'Savings & Investments',
      subtitle: 'Where do you invest?',
      icon: PiggyBank,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: "You're All Set!",
      subtitle: 'Start tracking your finances',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-600',
    },
  ]

  const toggleIncome = (source: string) => {
    setSelectedIncome(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    )
  }

  const addCustomIncome = () => {
    if (customIncome.trim() && !selectedIncome.includes(customIncome.trim())) {
      setSelectedIncome(prev => [...prev, customIncome.trim()])
      setCustomIncome('')
    }
  }

  const toggleExpense = (category: string) => {
    setSelectedExpenses(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const addCustomExpense = () => {
    if (customExpense.trim() && !selectedExpenses.includes(customExpense.trim())) {
      setSelectedExpenses(prev => [...prev, customExpense.trim()])
      setCustomExpense('')
    }
  }

  const toggleSavings = (instrument: typeof DEFAULT_SAVINGS_INSTRUMENTS[0]) => {
    setSelectedSavings(prev =>
      prev.find(s => s.name === instrument.name)
        ? prev.filter(s => s.name !== instrument.name)
        : [...prev, instrument]
    )
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Create income sources
      for (const source of selectedIncome) {
        await fetch('/api/masters/income-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: source }),
        })
      }

      // Create expense categories
      for (const category of selectedExpenses) {
        await fetch('/api/masters/expense-verticals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: category }),
        })
      }

      // Create savings instruments
      for (const instrument of selectedSavings) {
        await fetch('/api/masters/savings-instruments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(instrument),
        })
      }

      // Mark onboarding as complete
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      toast({
        title: 'Setup Complete!',
        description: 'Your categories have been created. Start tracking!',
      })

      onComplete()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedIncome.length > 0
      case 2:
        return selectedExpenses.length > 0
      case 3:
        return selectedSavings.length > 0
      default:
        return true
    }
  }

  const currentStep = steps[step]
  const Icon = currentStep.icon

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
          <div
            key={step}
            className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br",
                  currentStep.color
                )}
              >
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{currentStep.title}</h1>
              <p className="text-muted-foreground mt-1">{currentStep.subtitle}</p>
            </div>

            {/* Step content */}
            <div className="flex-1 px-6 overflow-y-auto pb-4">
              {step === 0 && (
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Track Income</p>
                        <p className="text-sm text-muted-foreground">Record all your earnings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Monitor Expenses</p>
                        <p className="text-sm text-muted-foreground">Keep tabs on spending</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <PiggyBank className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Grow Savings</p>
                        <p className="text-sm text-muted-foreground">Watch your wealth build</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Let&apos;s set up your categories to get started
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select your income sources or add custom ones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_INCOME_SOURCES.map((source) => (
                      <button
                        key={source}
                        onClick={() => toggleIncome(source)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          selectedIncome.includes(source)
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        {selectedIncome.includes(source) && (
                          <Check className="h-4 w-4 inline mr-1" />
                        )}
                        {source}
                      </button>
                    ))}
                    {selectedIncome
                      .filter(s => !DEFAULT_INCOME_SOURCES.includes(s))
                      .map((source) => (
                        <button
                          key={source}
                          onClick={() => toggleIncome(source)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-600 text-white"
                        >
                          <Check className="h-4 w-4 inline mr-1" />
                          {source}
                        </button>
                      ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Add custom source..."
                      value={customIncome}
                      onChange={(e) => setCustomIncome(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomIncome()}
                      className="flex-1"
                    />
                    <Button onClick={addCustomIncome} variant="outline">
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select expense categories that apply to you
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_EXPENSE_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleExpense(category)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          selectedExpenses.includes(category)
                            ? "bg-red-600 text-white"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        {selectedExpenses.includes(category) && (
                          <Check className="h-4 w-4 inline mr-1" />
                        )}
                        {category}
                      </button>
                    ))}
                    {selectedExpenses
                      .filter(c => !DEFAULT_EXPENSE_CATEGORIES.includes(c))
                      .map((category) => (
                        <button
                          key={category}
                          onClick={() => toggleExpense(category)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-red-600 text-white"
                        >
                          <Check className="h-4 w-4 inline mr-1" />
                          {category}
                        </button>
                      ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Add custom category..."
                      value={customExpense}
                      onChange={(e) => setCustomExpense(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomExpense()}
                      className="flex-1"
                    />
                    <Button onClick={addCustomExpense} variant="outline">
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Choose your savings and investment instruments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_SAVINGS_INSTRUMENTS.map((instrument) => (
                      <button
                        key={instrument.name}
                        onClick={() => toggleSavings(instrument)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          selectedSavings.find(s => s.name === instrument.name)
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        {selectedSavings.find(s => s.name === instrument.name) && (
                          <Check className="h-4 w-4 inline mr-1" />
                        )}
                        {instrument.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 py-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-muted-foreground">
                      You&apos;ve selected:
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-emerald-500/10 rounded-xl">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {selectedIncome.length} Income Sources
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedIncome.join(', ')}
                      </p>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-xl">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        {selectedExpenses.length} Expense Categories
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedExpenses.join(', ')}
                      </p>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-xl">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {selectedSavings.length} Savings Instruments
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedSavings.map(s => s.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-border bg-background">
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            onClick={nextStep}
            disabled={!canProceed() || loading}
            className={cn(
              "flex-1",
              step === 0 && "w-full"
            )}
          >
            {loading ? (
              'Setting up...'
            ) : step === steps.length - 1 ? (
              'Start Using App'
            ) : (
              <>
                {step === 0 ? "Let's Go" : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
        {step > 0 && step < steps.length - 1 && (
          <button
            onClick={() => setStep(steps.length - 1)}
            className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-foreground"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
