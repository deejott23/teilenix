import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  const { tripId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!me) return NextResponse.json({ error: 'Kein Teilnehmer' }, { status: 403 })

  // Toggle: try delete first, if nothing deleted → insert
  const { count } = await supabase
    .from('packlist_checks')
    .delete({ count: 'exact' })
    .eq('item_id', itemId)
    .eq('participant_id', me.id)

  if (count === 0) {
    await supabase
      .from('packlist_checks')
      .insert({ item_id: itemId, participant_id: me.id })
  }

  return NextResponse.json({ ok: true })
}
