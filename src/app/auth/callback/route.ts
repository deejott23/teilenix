import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Run first-time setup here (only on login), not on every page load
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          const displayName =
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            user.email?.split('@')[0] ??
            ''
          await supabase.rpc('auto_setup_user', {
            p_full_name: displayName,
            p_email: user.email ?? '',
            p_user_id: user.id,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed – redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
