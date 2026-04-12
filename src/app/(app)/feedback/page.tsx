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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const [{ data: comments }, { data: likes }] = await Promise.all([
    adminAny
      .from('feedback_comments')
      .select('*')
      .order('created_at', { ascending: false }),
    adminAny
      .from('feedback_likes')
      .select('*'),
  ])

  // Attach likes to their comments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsWithLikes = ((comments ?? []) as any[]).map((c: any) => ({
    ...c,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    likes: ((likes ?? []) as any[]).filter((l: any) => l.feedback_id === c.id),
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
