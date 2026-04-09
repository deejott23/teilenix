import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ThreadDetail from '@/components/gruppe/ThreadDetail'
import type { GroupThread, GroupMessage, TripParticipant } from '@/types/app'

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ tripId: string; threadId: string }>
}) {
  const { tripId, threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    { data: threadRaw },
    { data: participantsRaw },
    { data: messagesRaw },
    { data: reactionsRaw },
  ] = await Promise.all([
    db.from('group_threads').select('*').eq('id', threadId).eq('trip_id', tripId).maybeSingle(),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    db.from('group_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(200),
    db.from('message_reactions')
      .select('*')
      .in('message_id',
        db.from('group_messages').select('id').eq('thread_id', threadId)
      ),
  ])

  if (!threadRaw) notFound()

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  const thread = {
    ...threadRaw,
    message_count: (messagesRaw ?? []).length,
    last_message: null,
  } as GroupThread

  const reactMap = new Map<string, { emoji: string; participant_id: string }[]>()
  ;(reactionsRaw ?? []).forEach((r: { message_id: string; emoji: string; participant_id: string }) => {
    const arr = reactMap.get(r.message_id) ?? []
    arr.push({ emoji: r.emoji, participant_id: r.participant_id })
    reactMap.set(r.message_id, arr)
  })

  const messages: GroupMessage[] = (messagesRaw ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    reactions: reactMap.get(m.id as string) ?? [],
  })) as GroupMessage[]

  return (
    <ThreadDetail
      tripId={tripId}
      thread={thread}
      initialMessages={messages}
      participants={participants}
      myParticipantId={myParticipantId}
    />
  )
}
