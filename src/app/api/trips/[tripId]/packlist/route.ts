import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  title:           z.string().min(1).max(100),
  item_type:       z.enum(['bringing', 'group_need']),
  quantity_needed: z.number().int().min(1).max(99).optional().default(1),
  group_id:        z.string().uuid().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: items }, { data: participants }] = await Promise.all([
    supabase.from('packlist_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
    supabase.from('trip_participants').select('id, name, user_id').eq('trip_id', tripId),
  ])

  const itemIds = (items ?? []).map((i: { id: string }) => i.id)
  const [{ data: checks }, { data: claims }] = itemIds.length > 0
    ? await Promise.all([
        supabase.from('packlist_checks').select('item_id, participant_id').in('item_id', itemIds),
        supabase.from('packlist_claims').select('id, item_id, participant_id, quantity_claimed').in('item_id', itemIds),
      ])
    : [{ data: [] }, { data: [] }]

  const participantMap = new Map((participants ?? []).map(p => [p.id as string, p.name as string]))
  const myParticipantIds = (participants ?? []).filter((p: { user_id: string | null }) => p.user_id === user.id).map((p: { id: string }) => p.id)
  const checkedSet = new Set(
    (checks ?? [])
      .filter((c: { participant_id: string }) => myParticipantIds.includes(c.participant_id))
      .map((c: { item_id: string }) => c.item_id)
  )

  const enriched = (items ?? []).map((item: Record<string, unknown>) => ({
    ...item,
    checked:      checkedSet.has(item.id as string),
    creator_name: participantMap.get(item.created_by_participant_id as string) ?? 'Unbekannt',
    claims: (claims ?? [])
      .filter((c: Record<string, unknown>) => c.item_id === item.id)
      .map((c: Record<string, unknown>) => ({
        ...c,
        participant_name: participantMap.get(c.participant_id as string) ?? 'Unbekannt',
      })),
  }))

  return NextResponse.json(enriched)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { data: me } = await supabase
    .from('trip_participants')
    .select('id, group_id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!me) return NextResponse.json({ error: 'Kein Teilnehmer' }, { status: 403 })

  const { title, item_type, quantity_needed } = parsed.data

  const { data, error } = await supabase
    .from('packlist_items')
    .insert({
      trip_id: tripId,
      created_by_participant_id: me.id,
      item_type,
      title,
      quantity_needed: item_type === 'group_need' ? quantity_needed : 1,
      group_id: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
