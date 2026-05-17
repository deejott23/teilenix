import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import EssenClient from '@/components/essen/EssenClient'
import { queryKeys } from '@/lib/query/queryKeys'
import { getUser } from '@/lib/supabase/user'
import { getTrip } from '@/lib/supabase/trips'
import type { MealIdea, MealSlot, TripParticipant } from '@/types/app'

export default async function EssenPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Single round-trip: ideas with embedded votes (no waterfall)
  const [trip, { data: participantsRaw }, { data: ideasRaw }, { data: slotsRaw }] = await Promise.all([
    getTrip(tripId),
    supabase.from('trip_participants').select('id, name, user_id, is_group, shares, group_id').eq('trip_id', tripId),
    db.from('trip_meal_ideas').select('*, trip_meal_votes(*)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    db.from('trip_meal_slots').select('*').eq('trip_id', tripId).order('slot_date', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p.name]))

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  // Votes embedded — no second round-trip
  const ideas: MealIdea[] = (ideasRaw ?? []).map((raw: Record<string, unknown>) => {
    const ideaVotes = (raw.trip_meal_votes as Array<{ participant_id: string; vote: string }>) ?? []
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

  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.meals.byTrip(tripId), { ideas, slots })

  return (
    <>
      <RealtimeQueryRefresher
        tripId={tripId}
        tables={['trip_meal_ideas', 'trip_meal_votes', 'trip_meal_slots']}
      />
      <TripSubNav tripId={tripId} variant="planen" tabs={[
        { href: '/essen',    label: '🍽️ Essen' },
        { href: '/planen',   label: '✈️ Ausflüge' },
        { href: '/kalender', label: '📅 Kalender' },
      ]} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EssenClient
          tripId={tripId}
          participants={participants}
          myParticipantId={myParticipantId}
          tripStartDate={(trip?.start_date as string | null) ?? null}
          tripEndDate={(trip?.end_date as string | null) ?? null}
          isActive={trip?.status === 'active'}
        />
      </HydrationBoundary>
    </>
  )
}
