import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateTripSchema } from '@/lib/validations/trip'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      trip_families (
        id, shares, joined_at,
        families ( id, name, default_shares, invite_code )
      )
    `)
    .eq('id', tripId)
    .single()

  if (error || !trip) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })

  return NextResponse.json({ trip })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const parsed = updateTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.description !== undefined) updates.description = parsed.data.description
  if (parsed.data.startDate !== undefined) updates.start_date = parsed.data.startDate
  if (parsed.data.endDate !== undefined) updates.end_date = parsed.data.endDate
  if (parsed.data.status !== undefined) updates.status = parsed.data.status

  const { data: trip, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .eq('created_by', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ trip })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ success: true })
}
