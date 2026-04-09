import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string; threadId: string; messageId: string }> }
) {
  const { tripId, messageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emoji } = await req.json()
  if (!emoji) return NextResponse.json({ error: 'Emoji fehlt' }, { status: 400 })

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Kein Teilnehmer' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('participant_id', participant.id)
    .maybeSingle()

  if (existing) {
    await db.from('message_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  }

  await db.from('message_reactions').insert({
    message_id: messageId,
    trip_id: tripId,
    participant_id: participant.id,
    emoji,
  })

  return NextResponse.json({ action: 'added' })
}
