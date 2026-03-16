import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTripSchema } from '@/lib/validations/trip'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const parsed = createTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, startDate, endDate } = parsed.data

  // Use SECURITY DEFINER RPC: creates trip + adds creator as first participant
  const { data: tripId, error } = await supabase.rpc('create_trip_with_participant', {
    p_name: name,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
  })

  if (error) {
    console.error('create_trip_with_participant error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trip: { id: tripId } }, { status: 201 })
}
