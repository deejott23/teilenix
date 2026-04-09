import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string; threadId: string }> }
) {
  const { tripId, threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: messages }, { data: reactions }] = await Promise.all([
    db.from('group_messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .limit(200),
    db.from('message_reactions')
      .select('*')
      .in(
        'message_id',
        // sub-select via filter on trip_id for perf
        db.from('group_messages').select('id').eq('thread_id', threadId)
      ),
  ])

  const reactMap = new Map<string, { emoji: string; participant_id: string }[]>()
  ;(reactions ?? []).forEach((r: { message_id: string; emoji: string; participant_id: string }) => {
    const arr = reactMap.get(r.message_id) ?? []
    arr.push({ emoji: r.emoji, participant_id: r.participant_id })
    reactMap.set(r.message_id, arr)
  })

  const enriched = (messages ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    reactions: reactMap.get(m.id as string) ?? [],
  }))

  return NextResponse.json(enriched)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string; threadId: string }> }
) {
  const { tripId, threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Inhalt fehlt' }, { status: 400 })

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Kein Teilnehmer' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_messages')
    .insert({
      thread_id: threadId,
      trip_id: tripId,
      participant_id: participant.id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, reactions: [] }, { status: 201 })
}
