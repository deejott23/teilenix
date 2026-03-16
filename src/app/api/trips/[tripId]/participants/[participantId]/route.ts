import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateParticipantSchema = z.object({
  name:     z.string().min(1).max(80).trim().optional(),
  shares:   z.number().int().min(1).max(20).optional(),
  group_id: z.string().uuid().nullable().optional(),
})

async function verifyCreator(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, userId: string) {
  const { data: trip } = await supabase
    .from('trips')
    .select('created_by, status')
    .eq('id', tripId)
    .maybeSingle()
  return trip ? { isCreator: trip.created_by === userId, status: trip.status } : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; participantId: string }> }
) {
  const { tripId, participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const tripInfo = await verifyCreator(supabase, tripId, user.id)
  if (!tripInfo) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })
  if (!tripInfo.isCreator) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await request.json()
  const parsed = updateParticipantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.shares !== undefined) update.shares = parsed.data.shares
  if ('group_id' in parsed.data) update.group_id = parsed.data.group_id ?? null

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trip_participants')
    .update(update)
    .eq('id', participantId)
    .eq('trip_id', tripId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ participant: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string; participantId: string }> }
) {
  const { tripId, participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const tripInfo = await verifyCreator(supabase, tripId, user.id)
  if (!tripInfo) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })
  if (!tripInfo.isCreator) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('trip_participants')
    .delete()
    .eq('id', participantId)
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}
