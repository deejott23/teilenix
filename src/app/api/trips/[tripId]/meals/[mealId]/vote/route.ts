import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; mealId: string }> }
) {
  const { tripId, mealId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .maybeSingle()

  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Check if vote exists
  const { data: existing } = await db.from('trip_meal_votes')
    .select('id')
    .eq('meal_idea_id', mealId)
    .eq('participant_id', participant.id)
    .maybeSingle()

  if (existing) {
    // Delete vote (toggle off)
    await db.from('trip_meal_votes')
      .delete()
      .eq('id', existing.id)
  } else {
    // Insert vote (toggle on)
    await db.from('trip_meal_votes').insert({
      meal_idea_id: mealId,
      participant_id: participant.id,
    })
  }

  // Return updated counts
  const { data: allVotes } = await db.from('trip_meal_votes')
    .select('participant_id')
    .eq('meal_idea_id', mealId)

  const vote_count = (allVotes ?? []).length
  const my_vote = (allVotes ?? []).some((v: { participant_id: string }) => v.participant_id === participant.id)

  return NextResponse.json({ vote_count, my_vote })
}
