import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTesterEmail } from '@/lib/tester'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isTesterEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('feedback_likes')
    .insert({ feedback_id: id, tester_email: user.email })

  if (error) {
    // Unique-Constraint-Verletzung = bereits geliked → ignorieren
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json({ error: 'Fehler beim Liken' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isTesterEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('feedback_likes')
    .delete()
    .eq('feedback_id', id)
    .eq('tester_email', user.email)

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Entfernen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
