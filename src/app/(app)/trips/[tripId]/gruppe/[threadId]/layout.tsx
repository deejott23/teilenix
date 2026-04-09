import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ThreadLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string; threadId: string }>
}) {
  const { tripId, threadId } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thread } = await (supabase as any)
    .from('group_threads')
    .select('title, message_count')
    .eq('id', threadId)
    .maybeSingle()

  if (!thread) notFound()

  return (
    <div className="-mx-4 -mt-5 flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Sub-header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <Link
          href={`/trips/${tripId}/gruppe`}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-bold text-foreground truncate">{thread.title}</h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pt-3 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
