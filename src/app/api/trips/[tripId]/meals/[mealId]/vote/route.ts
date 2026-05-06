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

  const body = await req.json()
  const vote: string = body.vote ?? 'yes'
  const participantIdParam: string | undefined = body.participantId

  if (!['yes', 'maybe', 'no'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 })
  }

  // Resolve participant
  const query = supabase.from('trip_participants').select('id').eq('user_id', user.id).eq('is_group', false)
  if (participantIdParam) query.eq('id', participantIdParam)
  const { data: participant } = await query.maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db.from('trip_meal_votes')
    .select('id, vote')
    .eq('meal_idea_id', mealId)
    .eq('participant_id', participant.id)
    .maybeSingle()

  if (existing) {
    if (existing.vote === vote) {
      // Toggle off — same vote clicked again
      await db.from('trip_meal_votes').delete().eq('id', existing.id)
    } else {
      // Change vote
      await db.from('trip_meal_votes').update({ vote }).eq('id', existing.id)
    }
  } else {
    await db.from('trip_meal_votes').insert({
      meal_idea_id: mealId,
      participant_id: participant.id,
      vote,
    })
  }

  const { data: allVotes } = await db.from('trip_meal_votes')
    .select('id, meal_idea_id, participant_id, vote, created_at')
    .eq('meal_idea_id', mealId)

  const votes = allVotes ?? []
  const vote_count = votes.filter((v: { vote: string }) => v.vote === 'yes').length
  const my_vote_value = votes.find((v: { participant_id: string }) => v.participant_id === participant.id)?.vote ?? null

  return NextResponse.json({ votes, vote_count, my_vote_value })
}
