import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  activity_type: z.enum(['activity','boat','food','culture','swimming','shopping','other']).optional(),
  description: z.string().nullable().optional(),
  activity_date: z.string().nullable().optional(),
  departure_time: z.string().nullable().optional(),
  duration_label: z.string().nullable().optional(),
  meeting_point: z.string().nullable().optional(),
  cost_per_person_cents: z.number().int().min(0).nullable().optional(),
  status: z.enum(['idea','confirmed','cancelled']).optional(),
  cover_emoji: z.string().nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string; activityId: string }> }) {
  const { activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: activity }, { data: votes }] = await Promise.all([
    db.from('trip_activities').select('*').eq('id', activityId).single(),
    db.from('trip_activity_votes').select('*').eq('activity_id', activityId),
  ])

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ activity, votes: votes ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tripId: string; activityId: string }> }) {
  const { activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('trip_activities')
    .update(parsed.data)
    .eq('id', activityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tripId: string; activityId: string }> }) {
  const { activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db.from('trip_activities').delete().eq('id', activityId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
