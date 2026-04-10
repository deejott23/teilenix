import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  emoji: z.string().min(1).optional(),
  description: z.string().max(300).optional().nullable(),
  tags: z.array(z.string()).optional(),
  link: z.string().url().optional().nullable().or(z.literal('')),
})

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; mealId: string }> }
) {
  const { tripId, mealId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify ownership
  const { data: idea } = await db.from('trip_meal_ideas')
    .select('created_by_participant_id')
    .eq('id', mealId)
    .eq('trip_id', tripId)
    .single()

  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (idea.created_by_participant_id !== participant.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Clear slots pointing to this meal
  await db.from('trip_meal_slots')
    .update({ meal_idea_id: null })
    .eq('meal_idea_id', mealId)
    .eq('trip_id', tripId)

  const { error } = await db.from('trip_meal_ideas')
    .delete()
    .eq('id', mealId)
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; mealId: string }> }
) {
  const { tripId, mealId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify ownership
  const { data: idea } = await db.from('trip_meal_ideas')
    .select('created_by_participant_id')
    .eq('id', mealId)
    .eq('trip_id', tripId)
    .single()

  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (idea.created_by_participant_id !== participant.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.emoji !== undefined) updateData.emoji = parsed.data.emoji
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description ?? null
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags
  if (parsed.data.link !== undefined) updateData.link = parsed.data.link || null

  const { data, error } = await db.from('trip_meal_ideas')
    .update(updateData)
    .eq('id', mealId)
    .eq('trip_id', tripId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
