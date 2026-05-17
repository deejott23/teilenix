import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PacklistClient from '@/components/packlist/PacklistClient'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/queryKeys'
import { getUser } from '@/lib/supabase/user'
import { getTrip } from '@/lib/supabase/trips'
import type { PacklistItem, TripParticipant } from '@/types/app'

export default async function PacklistPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Single round-trip: items with embedded checks + claims (no waterfall)
  const [trip, { data: participantsRaw }, { data: itemsRaw }] = await Promise.all([
    getTrip(tripId),
    supabase.from('trip_participants').select('id, name, user_id, group_id, is_group').eq('trip_id', tripId),
    db.from('packlist_items')
      .select('*, packlist_checks(item_id, participant_id), packlist_claims(id, item_id, participant_id, quantity_claimed)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p.name]))

  // My participant IDs for this trip (could be multiple if user has group assignments)
  const myParticipantIds = participants.filter(p => p.user_id === user.id).map(p => p.id)

  // checks + claims are embedded in each item — no second round-trip
  const checkedItemIds = new Set(
    (itemsRaw ?? []).flatMap((i: any) =>
      (i.packlist_checks ?? [])
        .filter((c: { participant_id: string }) => myParticipantIds.includes(c.participant_id))
        .map((c: { item_id: string }) => c.item_id)
    )
  )

  // My main participant (non-group)
  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''
  const myGroupId = me?.group_id ?? null
  const myGroupName = myGroupId ? (participantMap.get(myGroupId) ?? null) : null

  const items: PacklistItem[] = (itemsRaw ?? []).map((raw: any) => ({
    id:                        raw.id as string,
    trip_id:                   raw.trip_id as string,
    created_by_participant_id: raw.created_by_participant_id as string,
    item_type:                 raw.item_type as 'bringing' | 'group_need',
    title:                     raw.title as string,
    quantity_needed:           (raw.quantity_needed as number) ?? 1,
    group_id:                  raw.group_id as string | null,
    created_at:                raw.created_at as string,
    checked:                   checkedItemIds.has(raw.id as string),
    creator_name:              participantMap.get(raw.created_by_participant_id as string) ?? 'Unbekannt',
    claims: (raw.packlist_claims ?? [])
      .map((c: Record<string, unknown>) => ({
        id:               c.id as string,
        item_id:          c.item_id as string,
        participant_id:   c.participant_id as string,
        quantity_claimed: (c.quantity_claimed as number) ?? 1,
        participant_name: participantMap.get(c.participant_id as string) ?? 'Unbekannt',
      })),
  }))

  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.packlist.byTrip(tripId), items)
  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <RealtimeQueryRefresher tripId={tripId} tables={['packlist_items', 'packlist_checks', 'packlist_claims']} />
      <PacklistClient
        tripId={tripId}
        items={items}
        participants={participants}
        myParticipantId={myParticipantId}
        myGroupId={myGroupId}
        myGroupName={myGroupName}
        isActive={trip?.status === 'active'}
      />
    </HydrationBoundary>
  )
}
