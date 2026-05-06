import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; mealId: string }> }
) {
  const { tripId, mealId } = await params
  void tripId
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, participantId } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty content' }, { status: 400 })

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id, name')
    .eq('id', participantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db.from('trip_meal_comments').insert({
    meal_idea_id: mealId,
    participant_id: participant.id,
    content: content.trim(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ...data, participant_name: participant.name }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; mealId: string }> }
) {
  const { tripId, mealId } = await params
  void tripId
  void mealId
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId } = await req.json()

  const { data: participantsRaw } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('user_id', user.id)

  const myIds = (participantsRaw ?? []).map((p: { id: string }) => p.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from('trip_meal_comments')
    .delete()
    .eq('id', commentId)
    .in('participant_id', myIds)

  return NextResponse.json({ success: true })
}
