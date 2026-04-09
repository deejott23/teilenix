import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: threads, error } = await db
    .from('group_threads')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch last message + message count per thread
  const threadIds = (threads ?? []).map((t: { id: string }) => t.id)
  if (threadIds.length === 0) return NextResponse.json([])

  const [{ data: counts }, { data: lastMsgs }] = await Promise.all([
    db.from('group_messages')
      .select('thread_id')
      .in('thread_id', threadIds),
    db.from('group_messages')
      .select('thread_id, content, participant_id, created_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false }),
  ])

  const countMap = new Map<string, number>()
  ;(counts ?? []).forEach((r: { thread_id: string }) => {
    countMap.set(r.thread_id, (countMap.get(r.thread_id) ?? 0) + 1)
  })

  const lastMap = new Map<string, { content: string; participant_id: string; created_at: string }>()
  ;(lastMsgs ?? []).forEach((r: { thread_id: string; content: string; participant_id: string; created_at: string }) => {
    if (!lastMap.has(r.thread_id)) lastMap.set(r.thread_id, r)
  })

  const enriched = (threads ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    message_count: countMap.get(t.id as string) ?? 0,
    last_message: lastMap.get(t.id as string) ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, linked_type, linked_id, linked_title, linked_subtitle, linked_emoji } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Titel fehlt' }, { status: 400 })

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
    .from('group_threads')
    .insert({
      trip_id: tripId,
      created_by_participant_id: participant.id,
      title: title.trim(),
      linked_type: linked_type ?? null,
      linked_id: linked_id ?? null,
      linked_title: linked_title ?? null,
      linked_subtitle: linked_subtitle ?? null,
      linked_emoji: linked_emoji ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
