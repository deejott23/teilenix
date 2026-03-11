import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { joinFamilySchema } from '@/lib/validations/family'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Check if user already has a family
  const { data: existing } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Du bist bereits in einer Familie' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = joinFamilySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Find family by invite code
  const { data: family } = await supabase
    .from('families')
    .select('id, name')
    .eq('invite_code', parsed.data.inviteCode.toUpperCase())
    .maybeSingle()

  if (!family) {
    return NextResponse.json({ error: 'Einladungscode nicht gefunden' }, { status: 404 })
  }

  // Join family as member
  const { error } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: 'member',
    })

  if (error) {
    return NextResponse.json({ error: 'Beitreten fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ family }, { status: 200 })
}
