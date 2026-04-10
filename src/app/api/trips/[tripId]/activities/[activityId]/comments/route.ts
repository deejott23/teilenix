import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const insertSchema = z.object({
  content: z.string().min(1).max(500),
  participantId: z.string().uuid(),
})

type Params = { params: Promise<{ tripId: string; activityId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: comments, error } = await db
    .from('trip_activity_comments')
    .select('*, trip_participants(name)')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shaped = (comments ?? []).map((c: Record<string, unknown> & { trip_participants: { name: string } | null }) => ({
    id: c.id,
    activity_id: c.activity_id,
    participant_id: c.participant_id,
    content: c.content,
    created_at: c.created_at,
    participant_name: c.trip_participants?.name ?? 'Unbekannt',
  }))

  return NextResponse.json({ comments: shaped })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = insertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // Verify the participant belongs to this user
  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('id', parsed.data.participantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('trip_activity_comments')
    .insert({
      activity_id: activityId,
      participant_id: parsed.data.participantId,
      content: parsed.data.content,
    })
    .select('*, trip_participants(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    id: data.id,
    activity_id: data.activity_id,
    participant_id: data.participant_id,
    content: data.content,
    created_at: data.created_at,
    participant_name: data.trip_participants?.name ?? 'Unbekannt',
  }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { activityId } = await params
  const { commentId } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('trip_activity_comments')
    .delete()
    .eq('id', commentId)
    .eq('activity_id', activityId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
