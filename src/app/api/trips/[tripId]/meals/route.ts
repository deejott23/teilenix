import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(120),
  emoji: z.string().min(1).default('🍽️'),
  description: z.string().max(300).optional().nullable(),
  tags: z.array(z.string()).default([]),
  link: z.string().url().optional().nullable().or(z.literal('')),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const myParticipant = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .maybeSingle()

  const myParticipantId = myParticipant.data?.id ?? null

  const [{ data: ideasRaw }, { data: votesRaw }, { data: slotsRaw }, { data: participantsRaw }] = await Promise.all([
    db.from('trip_meal_ideas').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    db.from('trip_meal_votes').select('*').eq('trip_id', tripId),
    db.from('trip_meal_slots').select('*').eq('trip_id', tripId).order('slot_date', { ascending: true }),
    supabase.from('trip_participants').select('id, name').eq('trip_id', tripId),
  ])

  const participantMap = new Map((participantsRaw ?? []).map((p: { id: string; name: string }) => [p.id, p.name]))

  const allVotes = votesRaw ?? []

  const ideas = (ideasRaw ?? []).map((raw: Record<string, unknown>) => {
    const ideaVotes = allVotes.filter((v: { meal_idea_id: string }) => v.meal_idea_id === raw.id)
    return {
      ...raw,
      creator_name: participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
      vote_count: ideaVotes.length,
      my_vote: myParticipantId ? ideaVotes.some((v: { participant_id: string }) => v.participant_id === myParticipantId) : false,
    }
  })

  const ideaMap = new Map(ideas.map((i: { id: string }) => [i.id, i]))

  const slots = (slotsRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    meal: raw.meal_idea_id ? ideaMap.get(raw.meal_idea_id as string) ?? null : null,
  }))

  return NextResponse.json({ ideas, slots })
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
  const { data, error } = await db.from('trip_meal_ideas').insert({
    trip_id: tripId,
    created_by_participant_id: participant.id,
    title: parsed.data.title,
    emoji: parsed.data.emoji,
    description: parsed.data.description ?? null,
    tags: parsed.data.tags,
    link: parsed.data.link || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
