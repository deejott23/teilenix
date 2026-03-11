import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { joinTripSchema } from '@/lib/validations/trip'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!familyMember) {
    return NextResponse.json({ error: 'Keine Familie gefunden. Erstelle zuerst eine Familie.' }, { status: 400 })
  }

  // Check trip exists
  const { data: trip } = await supabase
    .from('trips')
    .select('id, status')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })
  if (trip.status === 'ended') return NextResponse.json({ error: 'Diese Reise ist bereits beendet' }, { status: 400 })

  // Check if family already joined
  const { data: existing } = await supabase
    .from('trip_families')
    .select('id')
    .eq('trip_id', tripId)
    .eq('family_id', familyMember.family_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Deine Familie ist bereits in dieser Reise' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = joinTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await supabase
    .from('trip_families')
    .insert({
      trip_id: tripId,
      family_id: familyMember.family_id,
      shares: parsed.data.shares,
    })

  if (error) return NextResponse.json({ error: 'Beitreten fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ success: true })
}
