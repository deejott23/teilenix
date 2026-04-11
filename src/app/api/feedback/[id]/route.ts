import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/tester'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const { status, developer_note } = await req.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from('feedback_comments')
    .update({ status, developer_note })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
