import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; participantId: string }> }
) {
  const { tripId, participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const { name, shares, group_id } = body as { name?: string; shares?: number; group_id?: string | null }

  const update: Record<string, unknown> = {}
  if (name !== undefined) update.name = name.trim()
  if (shares !== undefined) update.shares = shares
  if ('group_id' in body) update.group_id = group_id ?? null

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  const admin = createAdminClient()
  const { error } = await admin
    .from('trip_participants')
    .delete()
    .eq('id', participantId)
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
