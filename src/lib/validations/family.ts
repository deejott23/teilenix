import { z } from 'zod'

export const createFamilySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Maximal 50 Zeichen'),
  defaultShares: z.coerce.number().int().min(1, 'Mindestens 1 Person').max(20, 'Maximal 20 Personen'),
})

export const joinFamilySchema = z.object({
  inviteCode: z.string().min(1, 'Einladungscode ist erforderlich').toUpperCase(),
})

export const updateFamilySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  defaultShares: z.coerce.number().int().min(1).max(20).optional(),
})

export type CreateFamilyInput = z.infer<typeof createFamilySchema>
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>
