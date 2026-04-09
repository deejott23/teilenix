import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  vote: z.enum(['yes', 'maybe', 'no']),
  participantId: z.string().uuid(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string; activityId: string }> }) {
  const { activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { vote, participantId } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Check existing vote
  const { data: existing } = await db
    .from('trip_activity_votes')
    .select('*')
    .eq('activity_id', activityId)
    .eq('participant_id', participantId)
    .maybeSingle()

  if (existing && existing.vote === vote) {
    // Toggle off — delete
    await db.from('trip_activity_votes').delete()
      .eq('activity_id', activityId).eq('participant_id', participantId)
  } else if (existing) {
    // Update vote
    await db.from('trip_activity_votes').update({ vote })
      .eq('activity_id', activityId).eq('participant_id', participantId)
  } else {
    // Insert new vote
    await db.from('trip_activity_votes').insert({ activity_id: activityId, participant_id: participantId, vote })
  }

  // Return updated votes for this activity
  const { data: votes } = await db
    .from('trip_activity_votes')
    .select('*')
    .eq('activity_id', activityId)

  return NextResponse.json({ votes: votes ?? [] })
}
