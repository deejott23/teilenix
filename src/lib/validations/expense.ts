import { z } from 'zod'

const splitSchema = z.object({
  participantId: z.string().uuid(),
  shares: z.number().int().min(1),
})

export const createExpenseSchema = z.object({
  tripId: z.string().uuid(),
  paidByParticipantId: z.string().uuid(),
  title: z.string().min(1, 'Titel ist erforderlich').max(100),
  description: z.string().max(500).optional(),
  amountCents: z.number().int().min(1, 'Betrag muss größer als 0 sein'),
  currency: z.string().length(3).default('EUR'),
  category: z.string().default('other'),
  expenseDate: z.string(),
  splitMode: z.enum(['proportional', 'custom']).default('proportional'),
  splits: z.array(splitSchema).min(1, 'Mindestens ein Teilnehmer muss beteiligt sein'),
})

export const updateExpenseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  amountCents: z.number().int().min(1).optional(),
  currency: z.string().length(3).optional(),
  category: z.string().optional(),
  expenseDate: z.string().optional(),
  splitMode: z.enum(['proportional', 'custom']).optional(),
  splits: z.array(splitSchema).min(1).optional(),
  paidByParticipantId: z.string().uuid().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
