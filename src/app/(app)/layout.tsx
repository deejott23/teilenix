import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/layout/AppNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const displayName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? user.email?.split('@')[0]
    ?? 'Meine'

  // Only run auto_setup_user on first login (when profile doesn't exist yet)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    await supabase.rpc('auto_setup_user', {
      p_display_name: displayName,
      p_email: user.email ?? '',
      p_avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? '',
    })
  }

  return (
    <div className="min-h-screen bg-background pb-[72px] md:pb-0 md:pl-60">
      <AppNav userId={user.id} needsOnboarding={false} />
      <main className="max-w-2xl mx-auto px-4 py-7 md:max-w-3xl">
        {children}
      </main>
    </div>
  )
}
