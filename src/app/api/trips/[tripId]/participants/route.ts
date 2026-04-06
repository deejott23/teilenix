import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const addParticipantSchema = z.object({
  name:     z.string().min(1, 'Name erforderlich').max(80).trim(),
  shares:   z.number().int().min(1).max(20).default(1),
  is_group: z.boolean().default(false),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data, error } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Daten konnten nicht geladen werden' }, { status: 500 })

  return NextResponse.json({ participants: data })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Any trip member may add guests or groups
  const { data: trip } = await supabase
    .from('trips')
    .select('id, status')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })
  if (trip.status === 'ended') return NextResponse.json({ error: 'Reise ist bereits beendet' }, { status: 400 })

  const body = await request.json()
  const parsed = addParticipantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trip_participants')
    .insert({
      trip_id:  tripId,
      name:     parsed.data.name,
      shares:   parsed.data.shares,
      user_id:  null,
      is_group: parsed.data.is_group,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Teilnehmer konnte nicht hinzugefügt werden' }, { status: 500 })

  return NextResponse.json({ participant: data }, { status: 201 })
}
