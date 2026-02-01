'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Wallet, CreditCard, PiggyBank, Settings } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { savingsCategoryLabel } from '@/lib/utils'

interface IncomeSource {
  id: string
  name: string
  isDefault: boolean
  _count: { incomeEntries: number }
}

interface ExpenseVertical {
  id: string
  name: string
  isDefault: boolean
  _count: { expenseEntries: number }
}

interface SavingsInstrument {
  id: string
  name: string
  category: string
  isDefault: boolean
  _count: { savingsEntries: number }
}

const SAVINGS_CATEGORIES = [
  { value: 'FD_RD', label: 'Bank Deposits (FD/RD)' },
  { value: 'NPS_PPF', label: 'Retirement & Tax (NPS/PPF/EPF)' },
  { value: 'STOCKS_ETFS', label: 'Equities (Stocks/ETFs)' },
  { value: 'MF', label: 'Mutual Funds' },
]

const categoryColors: Record<string, { bg: string; text: string }> = {
  FD_RD: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300' },
  NPS_PPF: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300' },
  STOCKS_ETFS: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  MF: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300' },
}

export default function SettingsPage() {
  const { toast } = useToast()

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [editingIncomeSource, setEditingIncomeSource] = useState<IncomeSource | null>(null)
  const [deleteIncomeSource, setDeleteIncomeSource] = useState<IncomeSource | null>(null)
  const [incomeSourceName, setIncomeSourceName] = useState('')

  const [expenseVerticals, setExpenseVerticals] = useState<ExpenseVertical[]>([])
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpenseVertical, setEditingExpenseVertical] = useState<ExpenseVertical | null>(null)
  const [deleteExpenseVertical, setDeleteExpenseVertical] = useState<ExpenseVertical | null>(null)
  const [expenseVerticalName, setExpenseVerticalName] = useState('')

  const [savingsInstruments, setSavingsInstruments] = useState<SavingsInstrument[]>([])
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false)
  const [editingSavingsInstrument, setEditingSavingsInstrument] = useState<SavingsInstrument | null>(null)
  const [deleteSavingsInstrument, setDeleteSavingsInstrument] = useState<SavingsInstrument | null>(null)
  const [savingsInstrumentName, setSavingsInstrumentName] = useState('')
  const [savingsInstrumentCategory, setSavingsInstrumentCategory] = useState('')

  useEffect(() => {
    fetchIncomeSources()
    fetchExpenseVerticals()
    fetchSavingsInstruments()
  }, [])

  // Income Sources CRUD
  const fetchIncomeSources = async () => {
    try {
      const response = await fetch('/api/masters/income-sources')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setIncomeSources(data.sources)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load income sources', variant: 'destructive' })
    }
  }

  const openAddIncomeDialog = () => {
    setEditingIncomeSource(null)
    setIncomeSourceName('')
    setIncomeDialogOpen(true)
  }

  const openEditIncomeDialog = (source: IncomeSource) => {
    setEditingIncomeSource(source)
    setIncomeSourceName(source.name)
    setIncomeDialogOpen(true)
  }

  const handleIncomeSubmit = async () => {
    if (!incomeSourceName.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }

    try {
      const url = editingIncomeSource
        ? `/api/masters/income-sources/${editingIncomeSource.id}`
        : '/api/masters/income-sources'
      const method = editingIncomeSource ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: incomeSourceName.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      toast({ title: 'Success', description: editingIncomeSource ? 'Income source updated' : 'Income source created' })
      setIncomeDialogOpen(false)
      fetchIncomeSources()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' })
    }
  }

  const handleDeleteIncomeSource = async () => {
    if (!deleteIncomeSource) return
    try {
      const response = await fetch(`/api/masters/income-sources/${deleteIncomeSource.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }
      toast({ title: 'Success', description: 'Income source deleted' })
      setDeleteIncomeSource(null)
      fetchIncomeSources()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete', variant: 'destructive' })
    }
  }

  // Expense Verticals CRUD
  const fetchExpenseVerticals = async () => {
    try {
      const response = await fetch('/api/masters/expense-verticals')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setExpenseVerticals(data.verticals)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load expense categories', variant: 'destructive' })
    }
  }

  const openAddExpenseDialog = () => {
    setEditingExpenseVertical(null)
    setExpenseVerticalName('')
    setExpenseDialogOpen(true)
  }

  const openEditExpenseDialog = (vertical: ExpenseVertical) => {
    setEditingExpenseVertical(vertical)
    setExpenseVerticalName(vertical.name)
    setExpenseDialogOpen(true)
  }

  const handleExpenseSubmit = async () => {
    if (!expenseVerticalName.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }

    try {
      const url = editingExpenseVertical
        ? `/api/masters/expense-verticals/${editingExpenseVertical.id}`
        : '/api/masters/expense-verticals'
      const method = editingExpenseVertical ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: expenseVerticalName.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      toast({ title: 'Success', description: editingExpenseVertical ? 'Expense category updated' : 'Expense category created' })
      setExpenseDialogOpen(false)
      fetchExpenseVerticals()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' })
    }
  }

  const handleDeleteExpenseVertical = async () => {
    if (!deleteExpenseVertical) return
    try {
      const response = await fetch(`/api/masters/expense-verticals/${deleteExpenseVertical.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }
      toast({ title: 'Success', description: 'Expense category deleted' })
      setDeleteExpenseVertical(null)
      fetchExpenseVerticals()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete', variant: 'destructive' })
    }
  }

  // Savings Instruments CRUD
  const fetchSavingsInstruments = async () => {
    try {
      const response = await fetch('/api/masters/savings-instruments')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setSavingsInstruments(data.instruments)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load savings instruments', variant: 'destructive' })
    }
  }

  const openAddSavingsDialog = () => {
    setEditingSavingsInstrument(null)
    setSavingsInstrumentName('')
    setSavingsInstrumentCategory('')
    setSavingsDialogOpen(true)
  }

  const openEditSavingsDialog = (instrument: SavingsInstrument) => {
    setEditingSavingsInstrument(instrument)
    setSavingsInstrumentName(instrument.name)
    setSavingsInstrumentCategory(instrument.category)
    setSavingsDialogOpen(true)
  }

  const handleSavingsSubmit = async () => {
    if (!savingsInstrumentName.trim() || !savingsInstrumentCategory) {
      toast({ title: 'Error', description: 'Name and category are required', variant: 'destructive' })
      return
    }

    try {
      const url = editingSavingsInstrument
        ? `/api/masters/savings-instruments/${editingSavingsInstrument.id}`
        : '/api/masters/savings-instruments'
      const method = editingSavingsInstrument ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: savingsInstrumentName.trim(), category: savingsInstrumentCategory }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      toast({ title: 'Success', description: editingSavingsInstrument ? 'Savings instrument updated' : 'Savings instrument created' })
      setSavingsDialogOpen(false)
      fetchSavingsInstruments()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' })
    }
  }

  const handleDeleteSavingsInstrument = async () => {
    if (!deleteSavingsInstrument) return
    try {
      const response = await fetch(`/api/masters/savings-instruments/${deleteSavingsInstrument.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }
      toast({ title: 'Success', description: 'Savings instrument deleted' })
      setDeleteSavingsInstrument(null)
      fetchSavingsInstruments()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete', variant: 'destructive' })
    }
  }

  const getCategoryStyle = (category: string) => categoryColors[category] || categoryColors.FD_RD

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" description="Manage your categories and master data" />

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-muted/50">
        <Tabs defaultValue="income" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-card border shadow-sm p-1 rounded-xl w-full grid grid-cols-3 gap-1">
            <TabsTrigger value="income" className="rounded-lg data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 px-2 sm:px-4 text-xs sm:text-sm">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /><span className="hidden sm:inline">Income</span>
            </TabsTrigger>
            <TabsTrigger value="expense" className="rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400 px-2 sm:px-4 text-xs sm:text-sm">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /><span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="savings" className="rounded-lg data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 px-2 sm:px-4 text-xs sm:text-sm">
              <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /><span className="hidden sm:inline">Savings</span>
            </TabsTrigger>
          </TabsList>

          {/* Income Sources Tab */}
          <TabsContent value="income">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b bg-emerald-500/10 dark:bg-emerald-500/5 rounded-t-lg p-4 sm:p-6">
                <div>
                  <CardTitle className="text-base sm:text-lg text-foreground">Income Sources</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Manage categories for your income entries</CardDescription>
                </div>
                <Button onClick={openAddIncomeDialog} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />Add Source
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-0">
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {incomeSources.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">No income sources</p>
                        <p className="text-sm text-muted-foreground mt-1">Add your first income source</p>
                      </div>
                    </div>
                  ) : incomeSources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{source.name}</p>
                          <p className="text-xs text-muted-foreground">{source._count.incomeEntries} entries</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditIncomeDialog(source)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteIncomeSource(source)} disabled={source._count.incomeEntries > 0}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Entries</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeSources.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">No income sources</p>
                                <p className="text-sm text-muted-foreground mt-1">Add your first income source to get started</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : incomeSources.map((source) => (
                        <TableRow key={source.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="font-medium text-foreground">{source.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                              {source._count.incomeEntries} entries
                            </span>
                          </TableCell>
                          <TableCell>
                            {source.isDefault ? (
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Default</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Custom</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10" onClick={() => openEditIncomeDialog(source)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteIncomeSource(source)} disabled={source._count.incomeEntries > 0}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Verticals Tab */}
          <TabsContent value="expense">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b bg-red-500/10 dark:bg-red-500/5 rounded-t-lg p-4 sm:p-6">
                <div>
                  <CardTitle className="text-base sm:text-lg text-foreground">Expense Categories</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Manage categories for your expense entries</CardDescription>
                </div>
                <Button onClick={openAddExpenseDialog} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />Add Category
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-0">
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {expenseVerticals.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">No expense categories</p>
                        <p className="text-sm text-muted-foreground mt-1">Add your first expense category</p>
                      </div>
                    </div>
                  ) : expenseVerticals.map((vertical) => (
                    <div key={vertical.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{vertical.name}</p>
                          <p className="text-xs text-muted-foreground">{vertical._count.expenseEntries} entries</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditExpenseDialog(vertical)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteExpenseVertical(vertical)} disabled={vertical._count.expenseEntries > 0}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Entries</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseVerticals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                                <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">No expense categories</p>
                                <p className="text-sm text-muted-foreground mt-1">Add your first expense category to get started</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : expenseVerticals.map((vertical) => (
                        <TableRow key={vertical.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </div>
                              <span className="font-medium text-foreground">{vertical.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                              {vertical._count.expenseEntries} entries
                            </span>
                          </TableCell>
                          <TableCell>
                            {vertical.isDefault ? (
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Default</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">Custom</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10" onClick={() => openEditExpenseDialog(vertical)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteExpenseVertical(vertical)} disabled={vertical._count.expenseEntries > 0}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Savings Instruments Tab */}
          <TabsContent value="savings">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b bg-amber-500/10 dark:bg-amber-500/5 rounded-t-lg p-4 sm:p-6">
                <div>
                  <CardTitle className="text-base sm:text-lg text-foreground">Savings Instruments</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Manage instruments for your savings and investments</CardDescription>
                </div>
                <Button onClick={openAddSavingsDialog} className="bg-amber-500 hover:bg-amber-600 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />Add Instrument
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-0">
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {savingsInstruments.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                        <PiggyBank className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">No savings instruments</p>
                        <p className="text-sm text-muted-foreground mt-1">Add your first savings instrument</p>
                      </div>
                    </div>
                  ) : savingsInstruments.map((instrument) => {
                    const style = getCategoryStyle(instrument.category)
                    return (
                      <div key={instrument.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <PiggyBank className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{instrument.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                                {savingsCategoryLabel(instrument.category)}
                              </span>
                              <span className="text-xs text-muted-foreground">{instrument._count.savingsEntries} entries</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSavingsDialog(instrument)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteSavingsInstrument(instrument)} disabled={instrument._count.savingsEntries > 0}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Category</TableHead>
                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Entries</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savingsInstruments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                                <PiggyBank className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">No savings instruments</p>
                                <p className="text-sm text-muted-foreground mt-1">Add your first savings instrument to get started</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : savingsInstruments.map((instrument) => {
                        const style = getCategoryStyle(instrument.category)
                        return (
                          <TableRow key={instrument.id} className="hover:bg-muted/50">
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
                                {savingsCategoryLabel(instrument.category)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                  <PiggyBank className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="font-medium text-foreground">{instrument.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                {instrument._count.savingsEntries} entries
                              </span>
                            </TableCell>
                            <TableCell>
                              {instrument.isDefault ? (
                                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Default</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">Custom</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10" onClick={() => openEditSavingsDialog(instrument)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteSavingsInstrument(instrument)} disabled={instrument._count.savingsEntries > 0}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Income Source Dialog */}
      <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingIncomeSource ? 'Edit Income Source' : 'Add Income Source'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input value={incomeSourceName} onChange={(e) => setIncomeSourceName(e.target.value)} placeholder="e.g., Salary, Freelance" className="h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIncomeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleIncomeSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              {editingIncomeSource ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Vertical Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingExpenseVertical ? 'Edit Expense Category' : 'Add Expense Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input value={expenseVerticalName} onChange={(e) => setExpenseVerticalName(e.target.value)} placeholder="e.g., Groceries, Travel" className="h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExpenseSubmit} className="bg-red-600 hover:bg-red-700">
              {editingExpenseVertical ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Savings Instrument Dialog */}
      <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingSavingsInstrument ? 'Edit Savings Instrument' : 'Add Savings Instrument'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Category</Label>
              <Select value={savingsInstrumentCategory} onValueChange={setSavingsInstrumentCategory}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {SAVINGS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input value={savingsInstrumentName} onChange={(e) => setSavingsInstrumentName(e.target.value)} placeholder="e.g., FD, Stocks, PPF" className="h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSavingsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavingsSubmit} className="bg-amber-500 hover:bg-amber-600">
              {editingSavingsInstrument ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteIncomeSource} onOpenChange={() => setDeleteIncomeSource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIncomeSource} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteExpenseVertical} onOpenChange={() => setDeleteExpenseVertical(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense Category</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpenseVertical} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteSavingsInstrument} onOpenChange={() => setDeleteSavingsInstrument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Instrument</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSavingsInstrument} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
