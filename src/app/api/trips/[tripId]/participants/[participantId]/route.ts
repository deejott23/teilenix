import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateParticipantSchema = z.object({
  name:        z.string().min(1).max(80).trim().optional(),
  shares:      z.number().int().min(1).max(20).optional(),
  group_id:    z.string().uuid().nullable().optional(),
  recalculate: z.boolean().optional(),
})

async function verifyMember(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string) {
  const { data: trip } = await supabase
    .from('trips')
    .select('status')
    .eq('id', tripId)
    .maybeSingle()
  return trip ?? null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; participantId: string }> }
) {
  const { tripId, participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const tripInfo = await verifyMember(supabase, tripId)
  if (!tripInfo) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })

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

  // Retroactively update all proportional expense splits for this participant
  if (parsed.data.recalculate && parsed.data.shares !== undefined) {
    const { data: expenses } = await admin
      .from('expenses')
      .select('id')
      .eq('trip_id', tripId)
      .eq('split_mode', 'proportional')

    if (expenses && expenses.length > 0) {
      await admin
        .from('expense_splits')
        .update({ shares: parsed.data.shares })
        .eq('participant_id', participantId)
        .in('expense_id', expenses.map((e: { id: string }) => e.id))
    }
  }

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

  const tripInfo = await verifyMember(supabase, tripId)
  if (!tripInfo) return NextResponse.json({ error: 'Reise nicht gefunden' }, { status: 404 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('trip_participants')
    .delete()
    .eq('id', participantId)
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}
