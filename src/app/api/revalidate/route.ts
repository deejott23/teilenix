import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_PREFIXES = ['/trips/', '/dashboard']

/**
 * POST /api/revalidate
 * Invalidiert den Next.js Router-Cache für einen bestimmten Pfad.
 * Wird von Client-side Mutations nach erfolgreichen Schreiboperationen aufgerufen.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path } = await req.json()
  if (!path || !ALLOWED_PREFIXES.some(p => path.startsWith(p))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  revalidatePath(path)
  return NextResponse.json({ revalidated: true })
}
