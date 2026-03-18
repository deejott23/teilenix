import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Name darf nicht leer sein').max(50).trim(),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültiger Name' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.displayName })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ success: true })
}
