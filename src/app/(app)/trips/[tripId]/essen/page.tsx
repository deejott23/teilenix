import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import EssenClient from '@/components/essen/EssenClient'
import { queryKeys } from '@/lib/query/queryKeys'
import type { MealIdea, MealSlot, TripParticipant } from '@/types/app'

export default async function EssenPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: trip }, { data: participantsRaw }, { data: ideasRaw }, { data: slotsRaw }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    db.from('trip_meal_ideas').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    db.from('trip_meal_slots').select('*').eq('trip_id', tripId).order('slot_date', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p.name]))

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  const ideaIds = (ideasRaw ?? []).map((i: { id: string }) => i.id)
  const { data: votesRaw } = ideaIds.length > 0
    ? await db.from('trip_meal_votes').select('*').in('meal_idea_id', ideaIds)
    : { data: [] }

  const ideas: MealIdea[] = (ideasRaw ?? []).map((raw: Record<string, unknown>) => {
    const ideaVotes = (votesRaw ?? []).filter((v: { meal_idea_id: string }) => v.meal_idea_id === raw.id)
    return {
      ...raw,
      creator_name: participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
      vote_count: ideaVotes.filter((v: { vote: string }) => v.vote === 'yes').length,
      maybe_count: ideaVotes.filter((v: { vote: string }) => v.vote === 'maybe').length,
      no_count: ideaVotes.filter((v: { vote: string }) => v.vote === 'no').length,
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
