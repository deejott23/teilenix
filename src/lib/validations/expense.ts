import { z } from 'zod'

const expenseCategories = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'health', 'other'] as const

const splitSchema = z.object({
  familyId: z.string().uuid(),
  shares: z.number().int().min(1),
})

export const createExpenseSchema = z.object({
  tripId: z.string().uuid(),
  paidByFamilyId: z.string().uuid(),
  title: z.string().min(1, 'Titel ist erforderlich').max(100),
  description: z.string().max(500).optional(),
  amountCents: z.number().int().min(1, 'Betrag muss größer als 0 sein'),
  currency: z.string().length(3).default('EUR'),
  category: z.enum(expenseCategories).default('other'),
  expenseDate: z.string(),
  splitMode: z.enum(['proportional', 'custom']).default('proportional'),
  splits: z.array(splitSchema).min(1, 'Mindestens eine Familie muss beteiligt sein'),
})

export const updateExpenseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  amountCents: z.number().int().min(1).optional(),
  currency: z.string().length(3).optional(),
  category: z.enum(expenseCategories).optional(),
  expenseDate: z.string().optional(),
  splitMode: z.enum(['proportional', 'custom']).optional(),
  splits: z.array(splitSchema).min(1).optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
