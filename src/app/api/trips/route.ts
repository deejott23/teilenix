import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTripSchema } from '@/lib/validations/trip'
import { generateInviteCode } from '@/lib/invite'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Get user's family
  const { data: memberRaw } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!memberRaw) {
    return NextResponse.json({ error: 'Keine Familie gefunden' }, { status: 400 })
  }

  const familyMember = memberRaw as { family_id: string }

  // Get default shares from family
  const { data: familyRaw } = await supabase
    .from('families')
    .select('default_shares')
    .eq('id', familyMember.family_id)
    .single()

  const defaultSharesFromFamily = (familyRaw as { default_shares: number } | null)?.default_shares ?? 1

  const body = await request.json()
  const parsed = createTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, startDate, endDate } = parsed.data

  // Create trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      name,
      description: description ?? null,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      invite_code: generateInviteCode(),
      created_by: user.id,
    })
    .select()
    .single()

  if (tripError) {
    return NextResponse.json({ error: 'Reise konnte nicht erstellt werden' }, { status: 500 })
  }

  // Auto-join creator's family
  const { error: joinError } = await supabase
    .from('trip_families')
    .insert({
      trip_id: trip.id,
      family_id: familyMember.family_id,
      shares: defaultSharesFromFamily,
    })

  if (joinError) {
    return NextResponse.json({ error: 'Auto-Beitritt fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ trip }, { status: 201 })
}
