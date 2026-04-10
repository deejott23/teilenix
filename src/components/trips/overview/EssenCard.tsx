import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Flame } from 'lucide-react'

export default async function EssenCard({ tripId }: { tripId: string }) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: todaySlotsRaw }, { data: recentIdeasRaw }] = await Promise.all([
    db.from('trip_meal_slots')
      .select('slot_type, meal_idea_id, trip_meal_ideas(title, emoji)')
      .eq('trip_id', tripId)
      .eq('slot_date', today)
      .not('meal_idea_id', 'is', null),
    db.from('trip_meal_ideas')
      .select('id, title, emoji, description')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const todaySlots = (todaySlotsRaw ?? []) as {
    slot_type: 'lunch' | 'dinner'
    meal_idea_id: string
    trip_meal_ideas: { title: string; emoji: string } | null
  }[]

  const recentIdeas = (recentIdeasRaw ?? []) as {
    id: string
    title: string
    emoji: string
    description: string | null
  }[]

  if (todaySlots.length === 0 && recentIdeas.length === 0) return null

  const lunchSlot = todaySlots.find(s => s.slot_type === 'lunch')
  const dinnerSlot = todaySlots.find(s => s.slot_type === 'dinner')

  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[14px] font-bold text-foreground">
          🍽️ Essen
        </h2>
        <Link href={`/trips/${tripId}/essen`} className="text-[12px] font-bold text-primary flex items-center gap-0.5">
          Alle <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
        </Link>
      </div>

      {/* Today's meals */}
      {(lunchSlot || dinnerSlot) && (
        <div className="px-4 flex flex-col divide-y divide-border">
          {lunchSlot?.trip_meal_ideas && (
            <Link href={`/trips/${tripId}/essen`} className="flex items-center gap-2.5 py-2.5">
              <div className="w-9 h-9 bg-muted rounded-[12px] flex items-center justify-center text-[20px] flex-shrink-0">
                {lunchSlot.trip_meal_ideas.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-foreground truncate">{lunchSlot.trip_meal_ideas.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Heute Mittag</div>
              </div>
            </Link>
          )}
          {dinnerSlot?.trip_meal_ideas && (
            <Link href={`/trips/${tripId}/essen`} className="flex items-center gap-2.5 py-2.5">
              <div className="w-9 h-9 bg-muted rounded-[12px] flex items-center justify-center text-[20px] flex-shrink-0">
                {dinnerSlot.trip_meal_ideas.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-foreground truncate">{dinnerSlot.trip_meal_ideas.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Heute Abend</div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Recent ideas CTA */}
      {recentIdeas.length > 0 && (
        <Link
          href={`/trips/${tripId}/essen`}
          className="mx-4 mb-3.5 mt-2 px-3 py-2.5 bg-orange-50 rounded-[12px] border border-orange-100 flex items-center gap-2 cursor-pointer"
        >
          <div className="flex -space-x-1 flex-shrink-0">
            {recentIdeas.slice(0, 3).map(idea => (
              <span key={idea.id} className="text-[16px]">{idea.emoji}</span>
            ))}
          </div>
          <span className="text-[12px] font-bold text-orange-700 flex-1 truncate">
            {recentIdeas.length === 1
              ? `"${recentIdeas[0].title}" – jetzt abstimmen`
              : `${recentIdeas.length} Ideen warten auf deine Stimme`}
          </span>
          <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}

export function EssenCardSkeleton() {
  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-10 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-12 bg-muted animate-pulse rounded-xl" />
    </div>
  )
}
