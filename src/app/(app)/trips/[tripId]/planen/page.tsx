import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivityFeed from '@/components/activities/ActivityFeed'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'
import { getUser } from '@/lib/supabase/user'
import { getTrip } from '@/lib/supabase/trips'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

export default async function PlanenPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Single round-trip: activities with embedded votes + comments (no waterfall)
  const [trip, { data: participantsRaw }, { data: activitiesRaw }] = await Promise.all([
    getTrip(tripId),
    supabase.from('trip_participants').select('id, name, shares, user_id, group_id, is_group').eq('trip_id', tripId),
    db.from('trip_activities')
      .select('id, trip_id, created_by_participant_id, title, activity_type, description, link, activity_date, departure_time, duration_label, meeting_point, cost_per_person_cents, status, cover_emoji, created_at, updated_at, trip_activity_votes(id, activity_id, participant_id, vote, created_at), trip_activity_comments(activity_id)')
      .eq('trip_id', tripId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  const activities: ActivityWithVotes[] = (activitiesRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    votes: (raw.trip_activity_votes as Array<{ id: string; activity_id: string; participant_id: string; vote: string; created_at: string }>) ?? [],
    creator_name: participantMap.get(raw.created_by_participant_id as string)?.name ?? 'Unbekannt',
    comment_count: ((raw.trip_activity_comments as unknown[]) ?? []).length,
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
