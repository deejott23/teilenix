import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityType } from '@/types/app'

type DotColor = 'green' | 'teal' | 'blue' | 'amber' | 'purple'
type ActivityEvent = {
  id: string; emoji: string; title: string; subtitle: string
  rightText: string | null; rightVariant: 'amount' | 'arrow' | 'checked' | 'muted'
  href: string; timestamp: string; dotColor: DotColor
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'gestern'
  return `vor ${days} Tagen`
}

const dotColors: Record<DotColor, string> = {
  green: 'bg-green-500', teal: 'bg-primary', blue: 'bg-blue-500', amber: 'bg-amber-500', purple: 'bg-purple-500',
}
const iconBgs: Record<DotColor, string> = {
  green: 'bg-green-50', teal: 'bg-primary/10', blue: 'bg-blue-50', amber: 'bg-amber-50', purple: 'bg-purple-50',
}

export default async function ActivityStream({ tripId }: { tripId: string }) {
  const supabase = await createClient()

  const [
    { data: participantsRaw },
    { data: expensesRaw },
    { data: activitiesRaw },
    { data: packlistRaw },
    { data: shoppingRaw },
  ] = await Promise.all([
    supabase.from('trip_participants').select('id, name').eq('trip_id', tripId),
    supabase.from('expenses').select('id, title, amount_cents, paid_by_participant_id, created_at')
      .eq('trip_id', tripId).order('created_at', { ascending: false }).limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('trip_activities')
      .select('id, title, activity_type, cover_emoji, created_by_participant_id, created_at')
      .eq('trip_id', tripId).order('created_at', { ascending: false }).limit(3),
    supabase.from('packlist_items').select('id, title, item_type, created_by_participant_id, created_at')
      .eq('trip_id', tripId).order('created_at', { ascending: false }).limit(3),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('shopping_items').select('id, title, is_bought, created_at')
      .eq('trip_id', tripId).order('created_at', { ascending: false }).limit(3),
  ])

  const participantMap = new Map(((participantsRaw ?? []) as { id: string; name: string }[]).map(p => [p.id, p.name]))
  const events: ActivityEvent[] = []

  for (const e of (expensesRaw ?? []) as { id: string; title: string; amount_cents: number; paid_by_participant_id: string; created_at: string }[]) {
    events.push({
      id: e.id, emoji: '💶', title: e.title,
      subtitle: `${participantMap.get(e.paid_by_participant_id) ?? '?'} hat eingetragen`,
      rightText: formatCurrency(e.amount_cents), rightVariant: 'amount',
      href: `/trips/${tripId}/expenses`, timestamp: e.created_at, dotColor: 'green',
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of (activitiesRaw ?? []) as any[]) {
    const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type as ActivityType] ?? '✈️'
    events.push({
      id: a.id, emoji, title: a.title,
      subtitle: `${participantMap.get(a.created_by_participant_id) ?? '?'} hat vorgeschlagen`,
      rightText: null, rightVariant: 'arrow',
      href: `/trips/${tripId}/planen/${a.id}`, timestamp: a.created_at, dotColor: 'teal',
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (packlistRaw ?? []) as any[]) {
    events.push({
      id: p.id, emoji: p.item_type === 'bringing' ? '🎒' : '🛍️', title: p.title,
      subtitle: `${participantMap.get(p.created_by_participant_id) ?? '?'} zur Packliste`,
      rightText: null, rightVariant: 'arrow',
      href: `/trips/${tripId}/packlist`, timestamp: p.created_at, dotColor: 'blue',
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of (shoppingRaw ?? []) as any[]) {
    events.push({
      id: s.id, emoji: s.is_bought ? '✅' : '🛒', title: s.title,
      subtitle: s.is_bought ? 'Eingekauft' : 'Zum Einkaufszettel',
      rightText: s.is_bought ? '✓' : null, rightVariant: s.is_bought ? 'checked' : 'arrow',
      href: `/trips/${tripId}/einkauf`, timestamp: s.created_at, dotColor: 'amber',
    })
  }

  const sortedEvents = events.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8)

  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[14px] font-bold text-foreground">Letzte Aktivität</h2>
      </div>
      {sortedEvents.length === 0 ? (
        <div className="px-4 pb-4 text-[13px] text-muted-foreground">Noch keine Aktivitäten.</div>
      ) : (
        <div className="divide-y divide-border">
          {sortedEvents.map(event => (
            <Link key={event.id} href={event.href}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/40 active:bg-muted transition-colors"
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColors[event.dotColor])} />
              <span className={cn('w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] flex-shrink-0', iconBgs[event.dotColor])}>
                {event.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground truncate">{event.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {event.subtitle} · {formatRelativeTime(event.timestamp)}
                </div>
              </div>
              <div className={cn('text-[13px] font-bold flex-shrink-0',
                event.rightVariant === 'amount' ? 'text-foreground' :
                event.rightVariant === 'checked' ? 'text-green-600' : 'text-muted-foreground'
              )}>
                {event.rightVariant === 'arrow'
                  ? <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  : event.rightText}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function ActivityStreamSkeleton() {
  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="h-4 w-28 bg-muted animate-pulse rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 border-t border-border">
          <div className="w-2 h-2 rounded-full bg-muted animate-pulse flex-shrink-0" />
          <div className="w-8 h-8 rounded-[10px] bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
