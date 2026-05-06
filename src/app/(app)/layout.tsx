import AppNav from '@/components/layout/AppNav'
import FeedbackFab from '@/components/feedback/FeedbackFab'
import { isTesterEmail } from '@/lib/tester'
import { getUser } from '@/lib/supabase/user'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // middleware already redirects unauthenticated users — no redirect needed here.
  // getUser() is cached per-request, so this call is shared with child pages.
  const user = await getUser()
  const isTester = isTesterEmail(user?.email)

  return (
    <div className="min-h-screen bg-background pb-[72px] md:pb-0 md:pl-60">
      <AppNav userId={user!.id} needsOnboarding={false} />
      <main className="max-w-2xl mx-auto px-4 py-7 md:max-w-3xl">
        {children}
      </main>
      {isTester && <FeedbackFab />}
    </div>
  )
}
