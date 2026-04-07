import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PacklistClient from '@/components/packlist/PacklistClient'
import type { PacklistItem, TripParticipant } from '@/types/app'

export default async function PacklistPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: trip }, { data: participantsRaw }, { data: itemsRaw }] = await Promise.all([
    supabase.from('trips').select('status').eq('id', tripId).single(),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    supabase.from('packlist_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p.name]))

  const itemIds = (itemsRaw ?? []).map((i: { id: string }) => i.id)

  // Fetch checks + claims only if there are items
  const [checksRaw, claimsRaw] = itemIds.length > 0
    ? await Promise.all([
        supabase.from('packlist_checks').select('item_id, participant_id').in('item_id', itemIds),
        supabase.from('packlist_claims').select('*').in('item_id', itemIds),
      ])
    : [{ data: [] }, { data: [] }]

  // My participant IDs for this trip (could be multiple if user has group assignments)
  const myParticipantIds = participants.filter(p => p.user_id === user.id).map(p => p.id)
  const checkedItemIds = new Set(
    (checksRaw.data ?? [])
      .filter((c: { participant_id: string }) => myParticipantIds.includes(c.participant_id))
      .map((c: { item_id: string }) => c.item_id)
  )

  // My main participant (non-group)
  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''
  const myGroupId = me?.group_id ?? null
  const myGroupName = myGroupId ? (participantMap.get(myGroupId) ?? null) : null

  const items: PacklistItem[] = (itemsRaw ?? []).map((raw: Record<string, unknown>) => ({
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
    claims: (claimsRaw.data ?? [])
      .filter((c: Record<string, unknown>) => c.item_id === raw.id)
      .map((c: Record<string, unknown>) => ({
        id:               c.id as string,
        item_id:          c.item_id as string,
        participant_id:   c.participant_id as string,
        quantity_claimed: (c.quantity_claimed as number) ?? 1,
        participant_name: participantMap.get(c.participant_id as string) ?? 'Unbekannt',
      })),
  }))

  return (
    <PacklistClient
      tripId={tripId}
      items={items}
      participants={participants}
      myParticipantId={myParticipantId}
      myGroupId={myGroupId}
      myGroupName={myGroupName}
      isActive={trip?.status === 'active'}
    />
  )
}
