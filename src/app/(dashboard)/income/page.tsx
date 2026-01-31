'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Download, Wallet, TrendingUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { MonthSelector } from '@/components/month-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createIncomeEntrySchema, type CreateIncomeEntry } from '@/lib/validations'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'

interface IncomeSource {
  id: string
  name: string
}

interface IncomeEntry {
  id: string
  month: string
  amount: number
  notes: string | null
  createdAt: string
  source: {
    id: string
    name: string
  }
}

export default function IncomePage() {
  const { toast } = useToast()
  const [month, setMonth] = useState(getCurrentMonth())
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [sources, setSources] = useState<IncomeSource[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<IncomeEntry | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncomeEntry>({
    resolver: zodResolver(createIncomeEntrySchema),
    defaultValues: {
      month: month,
      sourceId: '',
      amount: 0,
      notes: '',
    },
  })

  const selectedSourceId = watch('sourceId')

  useEffect(() => {
    fetchSources()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [month])

  useEffect(() => {
    setValue('month', month)
  }, [month, setValue])

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/masters/income-sources')
      if (!response.ok) throw new Error('Failed to fetch sources')
      const data = await response.json()
      setSources(data.sources)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load income sources',
        variant: 'destructive',
      })
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/income?month=${month}`)
      if (!response.ok) throw new Error('Failed to fetch entries')
      const data = await response.json()
      setEntries(data.entries)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load income entries',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setEditingEntry(null)
    reset({
      month: month,
      sourceId: '',
      amount: 0,
      notes: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (entry: IncomeEntry) => {
    setEditingEntry(entry)
    reset({
      month: entry.month,
      sourceId: entry.source.id,
      amount: entry.amount,
      notes: entry.notes || '',
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CreateIncomeEntry) => {
    try {
      const url = editingEntry ? `/api/income/${editingEntry.id}` : '/api/income'
      const method = editingEntry ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save entry')
      }

      toast({
        title: 'Success',
        description: editingEntry
          ? 'Income entry updated successfully'
          : 'Income entry created successfully',
      })

      setDialogOpen(false)
      fetchEntries()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save entry',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteEntry) return

    try {
      const response = await fetch(`/api/income/${deleteEntry.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete entry')
      }

      toast({
        title: 'Success',
        description: 'Income entry deleted successfully',
      })

      setDeleteEntry(null)
      fetchEntries()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete entry',
        variant: 'destructive',
      })
    }
  }

  const exportData = () => {
    window.open(`/api/export?month=${month}&type=income`, '_blank')
  }

  const totalIncome = entries.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Income"
        description="Track your income sources and earnings"
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <MonthSelector month={month} onChange={setMonth} />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportData} className="bg-white">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Income</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-emerald-200 text-sm mt-1">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month
                </p>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Source</TableHead>
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
                        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Wallet className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">No income entries yet</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Click &quot;Add Income&quot; to record your first entry
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="font-medium text-gray-900">{entry.source.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(entry.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-gray-600 truncate block">
                          {entry.notes || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteEntry(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingEntry ? 'Edit Income Entry' : 'Add Income Entry'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="sourceId" className="text-gray-700">Source</Label>
                <Select
                  value={selectedSourceId}
                  onValueChange={(value) => setValue('sourceId', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sourceId && (
                  <p className="text-sm text-red-500">{errors.sourceId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-700">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-11"
                  placeholder="Enter amount"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-700">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes..."
                  className="resize-none"
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Saving...' : editingEntry ? 'Update' : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
