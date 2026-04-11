import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTesterEmail } from '@/lib/tester'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isTesterEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { page_path, feature_label, comment } = await req.json()

  if (!comment?.trim()) {
    return NextResponse.json({ error: 'Kommentar darf nicht leer sein' }, { status: 400 })
  }

  const { error } = await supabase
    .from('feedback_comments')
    .insert({
      page_path,
      feature_label,
      comment: comment.trim(),
      tester_email: user.email,
      tester_name: (user.user_metadata?.full_name as string | undefined)
        ?? (user.user_metadata?.name as string | undefined)
        ?? user.email.split('@')[0],
    })

  if (error) {
    console.error('Feedback insert error:', error)
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
