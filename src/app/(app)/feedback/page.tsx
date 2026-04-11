import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/tester'
import { redirect } from 'next/navigation'
import FeedbackAdminList from '@/components/feedback/FeedbackAdminList'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()
  const { data: comments } = await admin
    .from('feedback_comments')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tester-Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">{comments?.length ?? 0} Kommentare</p>
      </div>
      <FeedbackAdminList comments={comments ?? []} />
    </div>
  )
}
