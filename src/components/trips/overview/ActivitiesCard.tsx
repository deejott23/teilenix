import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/formatting'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityType } from '@/types/app'

export default async function ActivitiesCard({ tripId }: { tripId: string }) {
  const supabase = await createClient()

  // Run activities + current user's participant lookup in parallel
  const [{ data: activitiesRaw }, { data: { user } }, ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('trip_activities')
      .select('id, title, activity_type, cover_emoji, status, created_at, activity_date')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.auth.getUser(),
  ])

  const allActivities = (activitiesRaw ?? []) as {
    id: string; title: string; activity_type: ActivityType; cover_emoji: string | null
    status: string; created_at: string; activity_date: string | null
  }[]

  // Single query: get voted activity IDs for this user in this trip via join
  let votedActivityIds: string[] = []
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: myVotes } = await (supabase as any)
      .from('trip_activity_votes')
      .select('activity_id, trip_participants!inner(trip_id, user_id)')
      .eq('trip_participants.trip_id', tripId)
      .eq('trip_participants.user_id', user.id)
    votedActivityIds = (myVotes ?? []).map((v: { activity_id: string }) => v.activity_id)
  }

  const confirmedActivities = allActivities.filter(a => a.status === 'confirmed').slice(0, 2)
  const ideaCount = allActivities.filter(a => a.status === 'idea' && !votedActivityIds.includes(a.id)).length

  if (allActivities.length === 0) return null

  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[14px] font-bold text-foreground">
          ✈️ Ausflüge · {allActivities.length} gesamt
        </h2>
        <Link href={`/trips/${tripId}/planen`} className="text-[12px] font-bold text-primary flex items-center gap-0.5">
          Alle <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
        </Link>
      </div>

      {confirmedActivities.length > 0 && (
        <div className="px-4 flex flex-col divide-y divide-border">
          {confirmedActivities.map(a => {
            const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type] ?? '📍'
            return (
              <Link key={a.id} href={`/trips/${tripId}/planen/${a.id}`} className="flex items-center gap-2.5 py-2.5">
                <div className="w-9 h-9 bg-muted rounded-[12px] flex items-center justify-center text-[20px] flex-shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-foreground truncate">{a.title}</div>
                  {a.activity_date && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">{formatDate(a.activity_date)}</div>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100/80 whitespace-nowrap">
                  ✓ Bestätigt
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {ideaCount > 0 && (
        <Link
          href={`/trips/${tripId}/planen`}
          className="mx-4 mb-3.5 mt-2 px-3 py-2.5 bg-amber-50 rounded-[12px] border border-amber-100 flex items-center gap-2 cursor-pointer"
        >
          <span className="text-[12px] font-bold text-amber-700 flex-1">
            💡 {ideaCount} {ideaCount === 1 ? 'Idee wartet' : 'Ideen warten'} auf deine Stimme
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}

export function ActivitiesCardSkeleton() {
  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-10 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-12 bg-muted animate-pulse rounded-xl" />
    </div>
  )
}
