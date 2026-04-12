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

  const [{ data: comments }, { data: likes }] = await Promise.all([
    admin
      .from('feedback_comments')
      .select('*')
      .order('created_at', { ascending: false }),
    admin
      .from('feedback_likes')
      .select('*'),
  ])

  // Attach likes to their comments
  const commentsWithLikes = (comments ?? []).map(c => ({
    ...c,
    likes: (likes ?? []).filter(l => l.feedback_id === c.id),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tester-Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">{commentsWithLikes.length} Kommentare</p>
      </div>
      <FeedbackAdminList comments={commentsWithLikes} currentEmail={user.email} />
    </div>
  )
}
