'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Download, CreditCard, TrendingDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { MonthSelector } from '@/components/month-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createExpenseEntrySchema, type CreateExpenseEntry } from '@/lib/validations'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'

interface ExpenseVertical {
  id: string
  name: string
}

interface ExpenseEntry {
  id: string
  month: string
  amount: number
  notes: string | null
  createdAt: string
  vertical: { id: string; name: string }
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [month, setMonth] = useState(getCurrentMonth())
  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [verticals, setVerticals] = useState<ExpenseVertical[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<ExpenseEntry | null>(null)

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseEntry>({
    resolver: zodResolver(createExpenseEntrySchema),
    defaultValues: { month, verticalId: '', amount: 0, notes: '' },
  })

  const selectedVerticalId = watch('verticalId')

  useEffect(() => { fetchVerticals() }, [])
  useEffect(() => { fetchEntries() }, [month])
  useEffect(() => { setValue('month', month) }, [month, setValue])

  const fetchVerticals = async () => {
    try {
      const response = await fetch('/api/masters/expense-verticals')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setVerticals(data.verticals)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load expense categories', variant: 'destructive' })
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/expenses?month=${month}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setEntries(data.entries)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load entries', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setEditingEntry(null)
    reset({ month, verticalId: '', amount: 0, notes: '' })
    setDialogOpen(true)
  }

  const openEditDialog = (entry: ExpenseEntry) => {
    setEditingEntry(entry)
    reset({ month: entry.month, verticalId: entry.vertical.id, amount: entry.amount, notes: entry.notes || '' })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CreateExpenseEntry) => {
    try {
      const url = editingEntry ? `/api/expenses/${editingEntry.id}` : '/api/expenses'
      const method = editingEntry ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }
      toast({ title: 'Success', description: editingEntry ? 'Expense updated' : 'Expense added' })
      setDialogOpen(false)
      fetchEntries()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteEntry) return
    try {
      const response = await fetch(`/api/expenses/${deleteEntry.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast({ title: 'Success', description: 'Expense deleted' })
      setDeleteEntry(null)
      fetchEntries()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const exportData = () => window.open(`/api/export?month=${month}&type=expenses`, '_blank')
  const totalExpenses = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="flex flex-col h-full">
      <Header title="Expenses" description="Track your spending across categories" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <MonthSelector month={month} onChange={setMonth} />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportData} className="bg-white">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <Button onClick={openAddDialog} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />Add Expense
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-red-500 to-rose-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalExpenses)}</p>
                <p className="text-red-200 text-sm mt-1">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month</p>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl">
                <TrendingDown className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700">Notes</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date Added</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-8 w-8 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">No expense entries yet</p>
                          <p className="text-sm text-gray-500 mt-1">Click &quot;Add Expense&quot; to record your first entry</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="font-medium text-gray-900">{entry.vertical.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-red-600">{formatCurrency(entry.amount)}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-gray-600 truncate block">{entry.notes || '-'}</span>
                    </TableCell>
                    <TableCell className="text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEditDialog(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteEntry(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingEntry ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Category</Label>
                <Select value={selectedVerticalId} onValueChange={(v) => setValue('verticalId', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {verticals.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.verticalId && <p className="text-sm text-red-500">{errors.verticalId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Amount</Label>
                <Input type="number" step="0.01" min="0" className="h-11" placeholder="Enter amount" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Notes (optional)</Label>
                <Textarea placeholder="Add any notes..." className="resize-none" rows={3} {...register('notes')} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                {isSubmitting ? 'Saving...' : editingEntry ? 'Update' : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense Entry</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
