import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createFamilySchema } from '@/lib/validations/family'
import { generateInviteCode } from '@/lib/invite'

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
  const parsed = createFamilySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, defaultShares } = parsed.data

  // Create family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({
      name,
      default_shares: defaultShares,
      invite_code: generateInviteCode(),
      created_by: user.id,
    })
    .select()
    .single()

  if (familyError) {
    return NextResponse.json({ error: 'Familie konnte nicht erstellt werden' }, { status: 500 })
  }

  // Add user as admin
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) {
    return NextResponse.json({ error: 'Mitgliedschaft konnte nicht erstellt werden' }, { status: 500 })
  }

  return NextResponse.json({ family }, { status: 201 })
}
