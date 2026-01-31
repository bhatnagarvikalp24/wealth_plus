import { z } from 'zod'

// Month validation (YYYY-MM format)
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format')

// Amount validation (positive number)
export const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .max(999999999999, 'Amount is too large')

// Income Entry schemas
export const createIncomeEntrySchema = z.object({
  month: monthSchema,
  sourceId: z.string().min(1, 'Source is required'),
  amount: amountSchema,
  notes: z.string().optional(),
})

export const updateIncomeEntrySchema = z.object({
  month: monthSchema.optional(),
  sourceId: z.string().min(1).optional(),
  amount: amountSchema.optional(),
  notes: z.string().optional(),
})

// Expense Entry schemas
export const createExpenseEntrySchema = z.object({
  month: monthSchema,
  verticalId: z.string().min(1, 'Vertical is required'),
  amount: amountSchema,
  notes: z.string().optional(),
})

export const updateExpenseEntrySchema = z.object({
  month: monthSchema.optional(),
  verticalId: z.string().min(1).optional(),
  amount: amountSchema.optional(),
  notes: z.string().optional(),
})

// Savings Entry schemas
export const createSavingsEntrySchema = z.object({
  month: monthSchema,
  instrumentId: z.string().min(1, 'Instrument is required'),
  amount: amountSchema,
  notes: z.string().optional(),
})

export const updateSavingsEntrySchema = z.object({
  month: monthSchema.optional(),
  instrumentId: z.string().min(1).optional(),
  amount: amountSchema.optional(),
  notes: z.string().optional(),
})

// Master schemas
export const createIncomeSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

export const createExpenseVerticalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

export const savingsCategoryEnum = z.enum(['FD_RD', 'NPS_PPF', 'STOCKS_ETFS', 'MF'])

export const createSavingsInstrumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  category: savingsCategoryEnum,
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  securityQuestion: z.string().min(1, 'Security question is required'),
  securityAnswer: z.string().min(2, 'Security answer must be at least 2 characters'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  securityAnswer: z.string().min(1, 'Security answer is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  from: monthSchema,
  to: monthSchema,
})

// Export query schema
export const exportQuerySchema = z.object({
  month: monthSchema,
  type: z.enum(['income', 'expenses', 'savings', 'summary']),
})

// Types inferred from schemas
export type CreateIncomeEntry = z.infer<typeof createIncomeEntrySchema>
export type UpdateIncomeEntry = z.infer<typeof updateIncomeEntrySchema>
export type CreateExpenseEntry = z.infer<typeof createExpenseEntrySchema>
export type UpdateExpenseEntry = z.infer<typeof updateExpenseEntrySchema>
export type CreateSavingsEntry = z.infer<typeof createSavingsEntrySchema>
export type UpdateSavingsEntry = z.infer<typeof updateSavingsEntrySchema>
export type CreateIncomeSource = z.infer<typeof createIncomeSourceSchema>
export type CreateExpenseVertical = z.infer<typeof createExpenseVerticalSchema>
export type CreateSavingsInstrument = z.infer<typeof createSavingsInstrumentSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
export type ExportQuery = z.infer<typeof exportQuerySchema>
