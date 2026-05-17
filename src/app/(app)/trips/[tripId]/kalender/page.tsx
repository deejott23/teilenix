import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'
import UnifiedKalenderView from '@/components/kalender/UnifiedKalenderView'
import { queryKeys } from '@/lib/query/queryKeys'
import { getUser } from '@/lib/supabase/user'
import { getTrip } from '@/lib/supabase/trips'
import type { ActivityWithVotes, MealIdea, MealSlot, TripParticipant } from '@/types/app'

const PLANEN_TABS = [
  { href: '/essen',    label: '🍽️ Essen' },
  { href: '/planen',   label: '✈️ Ausflüge' },
  { href: '/kalender', label: '📅 Kalender' },
]

export default async function KalenderPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Single round-trip: activities + meals with embedded votes (no waterfall)
  const [
    trip,
    { data: participantsRaw },
    { data: activitiesRaw },
    { data: ideasRaw },
    { data: slotsRaw },
  ] = await Promise.all([
    getTrip(tripId),
    supabase.from('trip_participants').select('id, name, user_id, is_group, shares, group_id').eq('trip_id', tripId),
    db.from('trip_activities')
      .select('id, trip_id, created_by_participant_id, title, activity_type, description, link, activity_date, departure_time, duration_label, meeting_point, cost_per_person_cents, status, cover_emoji, created_at, updated_at, trip_activity_votes(id, activity_id, participant_id, vote, created_at)')
      .eq('trip_id', tripId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .order('departure_time', { ascending: true, nullsFirst: false }),
    db.from('trip_meal_ideas').select('*, trip_meal_votes(*)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    db.from('trip_meal_slots').select('*').eq('trip_id', tripId).order('slot_date', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p.name]))
  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  // Activities: votes embedded, no second round-trip
  const activities: ActivityWithVotes[] = (activitiesRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    votes: (raw.trip_activity_votes as Array<{ id: string; activity_id: string; participant_id: string; vote: string; created_at: string }>) ?? [],
    creator_name: participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
    comment_count: 0,
  })) as ActivityWithVotes[]

  // Meals: votes embedded, no second round-trip
  const ideas: MealIdea[] = (ideasRaw ?? []).map((raw: Record<string, unknown>) => {
    const ideaVotes = (raw.trip_meal_votes as Array<{ participant_id: string; vote: string; meal_idea_id: string }>) ?? []
    return {
      ...raw,
      creator_name: participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
      vote_count: ideaVotes.filter(v => v.vote === 'yes').length,
      maybe_count: ideaVotes.filter(v => v.vote === 'maybe').length,
      no_count: ideaVotes.filter(v => v.vote === 'no').length,
      my_vote_value: myParticipantId
        ? (ideaVotes.find(v => v.participant_id === myParticipantId)?.vote ?? null)
        : null,
    } as MealIdea
  })

  const ideaMap = new Map(ideas.map(i => [i.id, i]))
  const slots: MealSlot[] = (slotsRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    meal: raw.meal_idea_id ? ideaMap.get(raw.meal_idea_id as string) ?? undefined : undefined,
  } as MealSlot))

  // Hydrate React Query with meal data
  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.meals.byTrip(tripId), { ideas, slots })

  return (
    <>
      <RealtimeQueryRefresher
        tripId={tripId}
        tables={['trip_meal_ideas', 'trip_meal_votes', 'trip_meal_slots']}
      />
      <RealtimePageRefresher tripId={tripId} tables={['trip_activities', 'trip_activity_votes']} />
      <TripSubNav tripId={tripId} variant="planen" tabs={PLANEN_TABS} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UnifiedKalenderView
          tripId={tripId}
          initialActivities={activities}
          tripStartDate={(trip?.start_date as string | null) ?? null}
          tripEndDate={(trip?.end_date as string | null) ?? null}
          myParticipantId={myParticipantId}
          isActive={trip?.status === 'active'}
        />
      </HydrationBoundary>
    </>
  )
}
