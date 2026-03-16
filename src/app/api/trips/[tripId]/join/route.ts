import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const admin = createAdminClient()

  // Use admin to bypass RLS for trip lookup
  const { data: tripData } = await admin
    .from('trips')
    .select('id, status')
    .eq('id', tripId)
    .maybeSingle()

  if (!tripData) {
    return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })
  }

  if ((tripData as { status: string }).status === 'ended') {
    return NextResponse.json({ error: 'Reise bereits beendet' }, { status: 400 })
  }

  // Check already joined
  const { data: existing } = await admin
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, trip_id: tripId, already_joined: true })
  }

  // Get display name from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const name = (profile as { display_name?: string } | null)?.display_name ?? 'Unbekannt'

  const { error: insertError } = await admin
    .from('trip_participants')
    .insert({ trip_id: tripId, user_id: user.id, name, shares: 1 })

  if (insertError) {
    console.error('join insert error:', insertError)
    return NextResponse.json({ error: 'Beitreten fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ success: true, trip_id: tripId, already_joined: false })
}
