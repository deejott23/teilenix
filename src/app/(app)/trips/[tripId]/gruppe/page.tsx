import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ThreadList from '@/components/gruppe/ThreadList'
import type { GroupThread, TripParticipant } from '@/types/app'
import { formatCurrency } from '@/lib/formatting'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityType } from '@/types/app'

export default async function GruppePage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    { data: participantsRaw },
    { data: threadsRaw },
    { data: activitiesRaw },
    { data: expensesRaw },
    { data: packlistRaw },
    { data: shoppingRaw },
  ] = await Promise.all([
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    db.from('group_threads').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    db.from('trip_activities').select('id, title, activity_type, cover_emoji, activity_date').eq('trip_id', tripId).order('created_at', { ascending: false }),
    supabase.from('expenses').select('id, title, amount_cents').eq('trip_id', tripId).order('created_at', { ascending: false }).limit(30),
    supabase.from('packlist_items').select('id, title, item_type').eq('trip_id', tripId).order('created_at', { ascending: false }).limit(30),
    db.from('shopping_items').select('id, title, is_bought').eq('trip_id', tripId).order('created_at', { ascending: false }).limit(30),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  // Enrich threads with last_message + message_count
  const threadIds = (threadsRaw ?? []).map((t: { id: string }) => t.id)
  const { data: allMessages } = threadIds.length > 0
    ? await db.from('group_messages')
        .select('thread_id, content, participant_id, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const countMap = new Map<string, number>()
  const lastMap = new Map<string, { content: string; participant_id: string; created_at: string }>()
  ;(allMessages ?? []).forEach((m: { thread_id: string; content: string; participant_id: string; created_at: string }) => {
    countMap.set(m.thread_id, (countMap.get(m.thread_id) ?? 0) + 1)
    if (!lastMap.has(m.thread_id)) lastMap.set(m.thread_id, m)
  })

  const threads: GroupThread[] = (threadsRaw ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    message_count: countMap.get(t.id as string) ?? 0,
    last_message: lastMap.get(t.id as string) ?? null,
  })) as GroupThread[]

  // Linkable item lists for NewThreadSheet
  const activities = (activitiesRaw ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    title: a.title as string,
    subtitle: (a.activity_date as string) ?? 'Kein Datum',
    emoji: (a.cover_emoji as string) ?? activityTypeEmoji[(a.activity_type as ActivityType)] ?? '✈️',
  }))

  const expenses = (expensesRaw ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    title: e.title as string,
    subtitle: formatCurrency(e.amount_cents as number),
    emoji: '💶',
  }))

  const packlistItems = (packlistRaw ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    title: p.title as string,
    subtitle: p.item_type === 'bringing' ? 'Jemand bringt es mit' : 'Gruppenbedarf',
    emoji: '🎒',
  }))

  const shoppingItems = (shoppingRaw ?? [])
    .filter((s: Record<string, unknown>) => !s.is_bought)
    .map((s: Record<string, unknown>) => ({
      id: s.id as string,
      title: s.title as string,
      subtitle: 'Noch nicht eingekauft',
      emoji: '🛒',
    }))

  return (
    <ThreadList
      tripId={tripId}
      initialThreads={threads}
      participants={participants}
      myParticipantId={myParticipantId}
      activities={activities}
      expenses={expenses}
      packlistItems={packlistItems}
      shoppingItems={shoppingItems}
    />
  )
}
