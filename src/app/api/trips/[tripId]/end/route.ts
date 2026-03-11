import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: trip, error } = await supabase
    .from('trips')
    .update({ status: 'ended' })
    .eq('id', tripId)
    .eq('created_by', user.id)
    .select()
    .single()

  if (error || !trip) {
    return NextResponse.json({ error: 'Reise konnte nicht beendet werden' }, { status: 500 })
  }

  return NextResponse.json({ trip })
}
