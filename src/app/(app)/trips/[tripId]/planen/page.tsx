import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivityFeed from '@/components/activities/ActivityFeed'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

export default async function PlanenPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: trip }, { data: participantsRaw }, { data: activitiesRaw }] = await Promise.all([
    supabase.from('trips').select('status, start_date, end_date').eq('id', tripId).single(),
    supabase.from('trip_participants').select('id, name, shares, user_id, group_id, is_group').eq('trip_id', tripId),
    db.from('trip_activities').select('id, trip_id, created_by_participant_id, title, activity_type, description, link, activity_date, departure_time, duration_label, meeting_point, cost_per_person_cents, status, cover_emoji, created_at, updated_at').eq('trip_id', tripId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const activityIds = (activitiesRaw ?? []).map((a: { id: string }) => a.id)
  const [{ data: votesRaw }, { data: commentCountsRaw }] = await Promise.all([
    activityIds.length > 0
      ? db.from('trip_activity_votes').select('id, activity_id, participant_id, vote, created_at').in('activity_id', activityIds)
      : { data: [] },
    activityIds.length > 0
      ? db.from('trip_activity_comments').select('activity_id').in('activity_id', activityIds)
      : { data: [] },
  ])

  const commentCountMap: Record<string, number> = {}
  for (const row of (commentCountsRaw ?? [])) {
    commentCountMap[row.activity_id] = (commentCountMap[row.activity_id] ?? 0) + 1
  }

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  const activities: ActivityWithVotes[] = (activitiesRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    votes: (votesRaw ?? []).filter((v: { activity_id: string }) => v.activity_id === raw.id),
    creator_name: participantMap.get(raw.created_by_participant_id as string)?.name ?? 'Unbekannt',
    comment_count: commentCountMap[raw.id as string] ?? 0,
  })) as ActivityWithVotes[]

  return (
    <>
      <RealtimePageRefresher tripId={tripId} tables={['trip_activities', 'trip_activity_votes']} />
      <TripSubNav tripId={tripId} variant="planen" tabs={[
        { href: '/essen',    label: '🍽️ Essen' },
        { href: '/planen',   label: '✈️ Ausflüge' },
        { href: '/kalender', label: '📅 Kalender' },
      ]} />
      <ActivityFeed
      tripId={tripId}
      initialActivities={activities}
      participants={participants}
      myParticipantId={myParticipantId}
      tripStartDate={(trip?.start_date as string | null) ?? null}
      tripEndDate={(trip?.end_date as string | null) ?? null}
      isActive={trip?.status === 'active'}
    />
    </>
  )
}
