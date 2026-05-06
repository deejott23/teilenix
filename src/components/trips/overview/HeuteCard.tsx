import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Calendar } from 'lucide-react'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityType } from '@/types/app'

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function HeuteCard({ tripId }: { tripId: string }) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: slotsRaw }, { data: activitiesRaw }] = await Promise.all([
    db.from('trip_meal_slots')
      .select('slot_type, trip_meal_ideas(id, title, emoji)')
      .eq('trip_id', tripId)
      .eq('slot_date', today)
      .not('meal_idea_id', 'is', null),
    db.from('trip_activities')
      .select('id, title, activity_type, cover_emoji, status, departure_time')
      .eq('trip_id', tripId)
      .eq('activity_date', today)
      .in('status', ['confirmed', 'idea'])
      .order('departure_time', { ascending: true, nullsFirst: false }),
  ])

  const slots = (slotsRaw ?? []) as {
    slot_type: 'lunch' | 'dinner'
    trip_meal_ideas: { id: string; title: string; emoji: string } | null
  }[]

  const activities = (activitiesRaw ?? []) as {
    id: string
    title: string
    activity_type: ActivityType
    cover_emoji: string | null
    status: string
    departure_time: string | null
  }[]

  const hasContent = slots.length > 0 || activities.length > 0
  if (!hasContent) return null

  const lunchSlot = slots.find(s => s.slot_type === 'lunch')
  const dinnerSlot = slots.find(s => s.slot_type === 'dinner')
  const confirmedActivities = activities.filter(a => a.status === 'confirmed')
  const ideaActivities = activities.filter(a => a.status === 'idea')

  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h2 className="text-[14px] font-bold text-foreground">📅 Heute</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatWeekday(today)}</p>
        </div>
        <Link
          href={`/trips/${tripId}/planen`}
          className="flex items-center gap-1 text-[12px] font-bold text-primary"
        >
          <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
          Kalender
          <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Essen heute */}
        {(lunchSlot || dinnerSlot) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              🍽️ Essen
            </p>
            <div className="flex flex-col gap-1.5">
              {lunchSlot?.trip_meal_ideas && (
                <Link
                  href={`/trips/${tripId}/essen/${lunchSlot.trip_meal_ideas.id}`}
                  className="flex items-center gap-2.5 bg-muted/50 rounded-[12px] px-3 py-2"
                >
                  <span className="text-[18px] leading-none">{lunchSlot.trip_meal_ideas.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {lunchSlot.trip_meal_ideas.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Mittag</p>
                  </div>
                </Link>
              )}
              {dinnerSlot?.trip_meal_ideas && (
                <Link
                  href={`/trips/${tripId}/essen/${dinnerSlot.trip_meal_ideas.id}`}
                  className="flex items-center gap-2.5 bg-muted/50 rounded-[12px] px-3 py-2"
                >
                  <span className="text-[18px] leading-none">{dinnerSlot.trip_meal_ideas.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {dinnerSlot.trip_meal_ideas.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Abend</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Ausflüge heute */}
        {activities.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              ✈️ Ausflüge
            </p>
            <div className="flex flex-col gap-1.5">
              {confirmedActivities.map(a => {
                const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type] ?? '📍'
                return (
                  <Link
                    key={a.id}
                    href={`/trips/${tripId}/planen/${a.id}`}
                    className="flex items-center gap-2.5 bg-green-50 rounded-[12px] px-3 py-2 border border-green-100"
                  >
                    <span className="text-[18px] leading-none">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[10px] text-green-600 font-semibold">
                        {a.departure_time
                          ? `✓ Abfahrt ${a.departure_time.slice(0, 5)} Uhr`
                          : '✓ Bestätigt'}
                      </p>
                    </div>
                  </Link>
                )
              })}
              {ideaActivities.slice(0, 2).map(a => {
                const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type] ?? '📍'
                return (
                  <Link
                    key={a.id}
                    href={`/trips/${tripId}/planen/${a.id}`}
                    className="flex items-center gap-2.5 bg-amber-50 rounded-[12px] px-3 py-2 border border-amber-100"
                  >
                    <span className="text-[18px] leading-none">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[10px] text-amber-600">💡 Idee — abstimmen?</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function HeuteCardSkeleton() {
  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-16 bg-muted animate-pulse rounded-xl" />
    </div>
  )
}
