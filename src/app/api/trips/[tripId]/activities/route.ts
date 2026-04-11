import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(120),
  activity_type: z.enum(['activity','boat','food','culture','swimming','shopping','other']).default('activity'),
  description: z.string().optional().nullable(),
  link: z.string().url().optional().nullable().or(z.literal('')),
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
    .select('id, trip_id, created_by_participant_id, title, activity_type, description, link, activity_date, departure_time, duration_label, meeting_point, cost_per_person_cents, status, cover_emoji, created_at, updated_at')
    .eq('trip_id', tripId)
    .order('activity_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const activityIds = (activities ?? []).map((a: { id: string }) => a.id)

  const [{ data: votes }, { data: commentCounts }] = await Promise.all([
    activityIds.length > 0
      ? db.from('trip_activity_votes').select('id, activity_id, participant_id, vote, created_at').in('activity_id', activityIds)
      : { data: [] },
    activityIds.length > 0
      ? db.from('trip_activity_comments').select('activity_id').in('activity_id', activityIds)
      : { data: [] },
  ])

  // Aggregate comment counts per activity
  const countMap: Record<string, number> = {}
  for (const row of (commentCounts ?? [])) {
    countMap[row.activity_id] = (countMap[row.activity_id] ?? 0) + 1
  }

  const activitiesWithCounts = (activities ?? []).map((a: { id: string }) => ({
    ...a,
    comment_count: countMap[a.id] ?? 0,
  }))

  return NextResponse.json({ activities: activitiesWithCounts, votes: votes ?? [] })
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

  // Normalize empty link to null
  const insertData = {
    ...parsed.data,
    link: parsed.data.link || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db.from('trip_activities').insert({
    trip_id: tripId,
    created_by_participant_id: participant.id,
    ...insertData,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
