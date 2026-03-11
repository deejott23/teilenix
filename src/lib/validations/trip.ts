import { z } from 'zod'

export const createTripSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Maximal 100 Zeichen'),
  description: z.string().max(500, 'Maximal 500 Zeichen').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const joinTripSchema = z.object({
  shares: z.coerce.number().int().min(1, 'Mindestens 1 Anteil').max(20, 'Maximal 20 Anteile'),
})

export const updateTripSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'ended']).optional(),
})

export type CreateTripInput = z.infer<typeof createTripSchema>
export type JoinTripInput = z.infer<typeof joinTripSchema>
export type UpdateTripInput = z.infer<typeof updateTripSchema>
