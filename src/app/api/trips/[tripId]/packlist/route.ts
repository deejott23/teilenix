import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  title:          z.string().min(1).max(100),
  item_type:      z.enum(['bringing', 'group_need', 'group_private']),
  quantity_needed: z.number().int().min(1).max(99).optional().default(1),
  group_id:       z.string().uuid().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: items }, { data: checks }, { data: claims }, { data: participants }] =
    await Promise.all([
      supabase
        .from('packlist_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true }),
      supabase
        .from('packlist_checks')
        .select('item_id')
        .in('participant_id',
          supabase
            .from('trip_participants')
            .select('id')
            .eq('trip_id', tripId)
            .eq('user_id', user.id) as unknown as string[]
        ),
      supabase
        .from('packlist_claims')
        .select('*')
        .in('item_id',
          supabase
            .from('packlist_items')
            .select('id')
            .eq('trip_id', tripId) as unknown as string[]
        ),
      supabase
        .from('trip_participants')
        .select('id, name, user_id')
        .eq('trip_id', tripId),
    ])

  const participantMap = new Map((participants ?? []).map(p => [p.id, p.name as string]))
  const checkedItemIds = new Set((checks ?? []).map((c: { item_id: string }) => c.item_id))

  const enriched = (items ?? []).map((item: Record<string, unknown>) => ({
    ...item,
    checked: checkedItemIds.has(item.id as string),
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

  // Resolve current user's participant
  const { data: me } = await supabase
    .from('trip_participants')
    .select('id, group_id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!me) return NextResponse.json({ error: 'Kein Teilnehmer' }, { status: 403 })

  const { title, item_type, quantity_needed, group_id } = parsed.data

  // For group_private: auto-attach the user's group_id if not explicitly provided
  const resolvedGroupId =
    item_type === 'group_private'
      ? (group_id ?? me.group_id ?? null)
      : null

  const { data, error } = await supabase
    .from('packlist_items')
    .insert({
      trip_id: tripId,
      created_by_participant_id: me.id,
      item_type,
      title,
      quantity_needed: item_type === 'group_need' ? quantity_needed : 1,
      group_id: resolvedGroupId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
