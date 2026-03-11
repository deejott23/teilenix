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

  // Check if user has a family – if not, redirect to onboarding
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Get current URL to avoid redirect loops on onboarding page
  // Note: We use a simple check; the page itself handles the routing
  const needsOnboarding = !familyMember

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <AppNav userId={user.id} needsOnboarding={needsOnboarding} />
      <main className="max-w-2xl mx-auto px-4 py-6 md:max-w-3xl">
        {children}
      </main>
    </div>
  )
}
