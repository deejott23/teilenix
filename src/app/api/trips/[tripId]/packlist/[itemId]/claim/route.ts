import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  // quantity_claimed: null → remove claim; number → upsert
  quantity_claimed: z.number().int().min(1).max(99).nullable(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  const { tripId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { data: me } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!me) return NextResponse.json({ error: 'Kein Teilnehmer' }, { status: 403 })

  const { quantity_claimed } = parsed.data

  if (quantity_claimed === null) {
    // Remove claim
    await supabase
      .from('packlist_claims')
      .delete()
      .eq('item_id', itemId)
      .eq('participant_id', me.id)
  } else {
    // Upsert
    await supabase
      .from('packlist_claims')
      .upsert(
        { item_id: itemId, participant_id: me.id, quantity_claimed },
        { onConflict: 'item_id,participant_id' }
      )
  }

  return NextResponse.json({ ok: true })
}
