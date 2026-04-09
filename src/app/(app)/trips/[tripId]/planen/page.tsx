import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivityFeed from '@/components/activities/ActivityFeed'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

export default async function PlanenPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: trip }, { data: participantsRaw }, { data: activitiesRaw }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    db.from('trip_activities').select('*').eq('trip_id', tripId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const activityIds = (activitiesRaw ?? []).map((a: { id: string }) => a.id)
  const { data: votesRaw } = activityIds.length > 0
    ? await db.from('trip_activity_votes').select('*').in('activity_id', activityIds)
    : { data: [] }

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  const activities: ActivityWithVotes[] = (activitiesRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    votes: (votesRaw ?? []).filter((v: { activity_id: string }) => v.activity_id === raw.id),
    creator_name: participantMap.get(raw.created_by_participant_id as string)?.name ?? 'Unbekannt',
  })) as ActivityWithVotes[]

  return (
    <ActivityFeed
      tripId={tripId}
      initialActivities={activities}
      participants={participants}
      myParticipantId={myParticipantId}
      tripStartDate={(trip?.start_date as string | null) ?? null}
      tripEndDate={(trip?.end_date as string | null) ?? null}
      isActive={trip?.status === 'active'}
    />
  )
}
