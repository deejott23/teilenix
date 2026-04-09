import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(120),
  activity_type: z.enum(['activity','boat','food','culture','swimming','shopping','other']).default('activity'),
  description: z.string().optional().nullable(),
  activity_date: z.string().optional().nullable(),
  departure_time: z.string().optional().nullable(),
  duration_label: z.string().optional().nullable(),
  meeting_point: z.string().optional().nullable(),
  cost_per_person_cents: z.number().int().min(0).optional().nullable(),
  cover_emoji: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: activities } = await db
    .from('trip_activities')
    .select('*')
    .eq('trip_id', tripId)
    .order('activity_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const activityIds = (activities ?? []).map((a: { id: string }) => a.id)
  const { data: votes } = activityIds.length > 0
    ? await db.from('trip_activity_votes').select('*').in('activity_id', activityIds)
    : { data: [] }

  return NextResponse.json({ activities: activities ?? [], votes: votes ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

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
  const { data, error } = await db.from('trip_activities').insert({
    trip_id: tripId,
    created_by_participant_id: participant.id,
    ...parsed.data,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
