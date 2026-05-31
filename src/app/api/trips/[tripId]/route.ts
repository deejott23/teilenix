import { createClient, createAdminClient } from '@/lib/supabase/server'
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
    .select('*')
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
  if (parsed.data.enabledCategories !== undefined) updates.enabled_categories = parsed.data.enabledCategories
  if (parsed.data.customCategories !== undefined) updates.custom_categories = parsed.data.customCategories
  if (parsed.data.coverEmoji !== undefined) updates.cover_emoji = parsed.data.coverEmoji
  if (parsed.data.coverImageUrl !== undefined) updates.cover_image_url = parsed.data.coverImageUrl
  if (parsed.data.showPacklist !== undefined) updates.show_packlist = parsed.data.showPacklist

  const admin = createAdminClient()

  // Sensitive fields (name, status, dates) require creator rights
  const hasSensitiveField = ['name', 'description', 'startDate', 'endDate', 'status']
    .some(f => parsed.data[f as keyof typeof parsed.data] !== undefined)

  if (hasSensitiveField) {
    // Must be trip creator
    const { data: tripCheck } = await admin
      .from('trips').select('created_by').eq('id', tripId).maybeSingle()
    if (tripCheck?.created_by !== user.id)
      return NextResponse.json({ error: 'Nur der Ersteller kann dies ändern' }, { status: 403 })
  } else {
    // Category updates: any participant may update
    const { data: participation } = await supabase
      .from('trip_participants').select('id').eq('trip_id', tripId).eq('user_id', user.id).maybeSingle()
    if (!participation)
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data: trip, error } = await admin
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single()

  if (error || !trip) return NextResponse.json({ error: error?.message ?? 'Aktualisierung fehlgeschlagen' }, { status: 500 })

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

  const admin = createAdminClient()
  const { error } = await admin
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ success: true })
}
