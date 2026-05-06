import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'
import UnifiedKalenderView from '@/components/kalender/UnifiedKalenderView'
import { queryKeys } from '@/lib/query/queryKeys'
import type { ActivityWithVotes, MealIdea, MealSlot, TripParticipant } from '@/types/app'

const PLANEN_TABS = [
  { href: '/planen', label: '✈️ Ausflüge' },
  { href: '/essen',  label: '🍽️ Essen' },
  { href: '/kalender', label: '📅 Kalender' },
]

export default async function KalenderPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    { data: trip },
    { data: participantsRaw },
    { data: activitiesRaw },
    { data: ideasRaw },
    { data: slotsRaw },
  ] = await Promise.all([
    supabase.from('trips').select('status, start_date, end_date').eq('id', tripId).single(),
    supabase.from('trip_participants').select('id, name, user_id, is_group, shares, group_id').eq('trip_id', tripId),
    db.from('trip_activities')
      .select('id, trip_id, created_by_participant_id, title, activity_type, description, link, activity_date, departure_time, duration_label, meeting_point, cost_per_person_cents, status, cover_emoji, created_at, updated_at')
      .eq('trip_id', tripId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .order('departure_time', { ascending: true, nullsFirst: false }),
    db.from('trip_meal_ideas').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    db.from('trip_meal_slots').select('*').eq('trip_id', tripId).order('slot_date', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p.name]))
  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  // Build activities with votes
  const activityIds = (activitiesRaw ?? []).map((a: { id: string }) => a.id)
  const { data: votesRaw } = activityIds.length > 0
    ? await db.from('trip_activity_votes').select('id, activity_id, participant_id, vote, created_at').in('activity_id', activityIds)
    : { data: [] }

  const activities: ActivityWithVotes[] = (activitiesRaw ?? []).map((raw: Record<string, unknown>) => ({
    ...raw,
    votes: (votesRaw ?? []).filter((v: { activity_id: string }) => v.activity_id === raw.id),
    creator_name: participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
    comment_count: 0,
  })) as ActivityWithVotes[]

  // Build meals
  const ideaIds = (ideasRaw ?? []).map((i: { id: string }) => i.id)
  const { data: mealVotesRaw } = ideaIds.length > 0
    ? await db.from('trip_meal_votes').select('*').in('meal_idea_id', ideaIds)
    : { data: [] }

  const ideas: MealIdea[] = (ideasRaw ?? []).map((raw: Record<string, unknown>) => {
    const ideaVotes = (mealVotesRaw ?? []).filter((v: { meal_idea_id: string }) => v.meal_idea_id === raw.id)
    return {
      ...raw,
      creator_name: participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
      vote_count: ideaVotes.filter((v: { vote: string }) => v.vote === 'yes').length,
      my_vote_value: myParticipantId
        ? (ideaVotes.find((v: { participant_id: string }) => v.participant_id === myParticipantId)?.vote ?? null)
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
