import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency, formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import { activityTypeEmoji } from '@/lib/activities'
import type { ExpenseWithSplits, TripParticipant, ActivityType } from '@/types/app'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Types ──────────────────────────────────────────────────────────────────

type ActivityEvent = {
  id: string
  type: 'expense' | 'activity' | 'packlist' | 'shopping' | 'vote'
  emoji: string
  title: string
  subtitle: string
  rightText: string | null
  rightVariant: 'amount' | 'arrow' | 'checked' | 'muted'
  href: string
  timestamp: string
  dotColor: 'green' | 'teal' | 'blue' | 'amber' | 'purple'
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) notFound()

  // ── Parallel fetches ──────────────────────────────────────────────────

  const [
    { data: participantsRaw },
    { data: expensesRaw },
    { data: activitiesRaw },
    { data: packlistRaw },
    { data: packlistAllRaw },
    { data: shoppingRaw },
    { data: shoppingAllRaw },
  ] = await Promise.all([
    supabase
      .from('trip_participants')
      .select('*')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('expenses')
      .select('id, title, amount_cents, paid_by_participant_id, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(8),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('trip_activities')
      .select('id, title, activity_type, cover_emoji, status, created_by_participant_id, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(8) as Promise<{ data: any[] | null }>,
    supabase
      .from('packlist_items')
      .select('id, title, item_type, created_by_participant_id, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(5),
    // All packlist items for count
    supabase
      .from('packlist_items')
      .select('id, title, item_type, created_by_participant_id, created_at, quantity_needed')
      .eq('trip_id', tripId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('shopping_items')
      .select('id, title, is_bought, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(5) as Promise<{ data: any[] | null }>,
    // All shopping items for count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('shopping_items')
      .select('id, is_bought')
      .eq('trip_id', tripId) as Promise<{ data: any[] | null }>,
  ])

  // ── Expenses with splits (for settlement) ─────────────────────────────

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const expenseIds = ((expensesRaw ?? []) as { id: string }[]).map(e => e.id)

  // We need the full expenses (with splits) for settlement — fetch all
  const { data: allExpensesRaw } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)

  const allExpenseIds = ((allExpensesRaw ?? []) as { id: string }[]).map(e => e.id)
  const { data: splitsRaw } = allExpenseIds.length > 0
    ? await supabase.from('expense_splits').select('*').in('expense_id', allExpenseIds)
    : { data: [] }

  const splitsByExpense = new Map<string, unknown[]>()
  ;((splitsRaw ?? []) as { expense_id: string }[]).forEach(s => {
    const arr = splitsByExpense.get(s.expense_id) ?? []
    arr.push(s)
    splitsByExpense.set(s.expense_id, arr)
  })

  const expenses = ((allExpensesRaw ?? []) as { id: string; paid_by_participant_id: string }[])
    .map(e => ({
      ...e,
      expense_splits: ((splitsByExpense.get(e.id) ?? []) as { participant_id: string }[]).map(s => ({
        ...s,
        participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
      })),
      participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
    })) as unknown as ExpenseWithSplits[]

  // ── Settlement ────────────────────────────────────────────────────────

  const myParticipant = participants.find(p => p.user_id === user.id)
  const myParticipantId = myParticipant?.id ?? ''
  const settlement = computeSettlement(expenses, participants)
  const myBalance = settlement.balances.find(b => b.participantId === myParticipantId)

  // ── Trip meta ─────────────────────────────────────────────────────────

  const isActive = trip.status === 'active'
  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date as string)} – ${formatDate(trip.end_date as string)}`
    : trip.start_date ? `ab ${formatDate(trip.start_date as string)}` : null

  // ── Activities (Ausflüge) ─────────────────────────────────────────────

  const allActivities = (activitiesRaw ?? []) as any[]
  const confirmedActivities = allActivities.filter(a => a.status === 'confirmed').slice(0, 2)
  const ideaCount = allActivities.filter(a => a.status === 'idea').length

  // ── Packliste counts ──────────────────────────────────────────────────

  const allPacklistItems = (packlistAllRaw ?? []) as { id: string; item_type: string }[]
  const packlistTotal = allPacklistItems.length

  // Fetch packlist checks for my participant
  const packlistItemIds = allPacklistItems.map(i => i.id)
  const { data: checksRaw } = packlistItemIds.length > 0
    ? await supabase
        .from('packlist_checks')
        .select('item_id')
        .in('item_id', packlistItemIds)
        .eq('participant_id', myParticipantId)
    : { data: [] }

  const checkedCount = (checksRaw ?? []).length
  const packlistPct = packlistTotal > 0 ? Math.round((checkedCount / packlistTotal) * 100) : 0

  // ── Shopping counts ───────────────────────────────────────────────────

  const allShoppingItems = (shoppingAllRaw ?? []) as { id: string; is_bought: boolean }[]
  const shoppingOpenCount = allShoppingItems.filter(s => !s.is_bought).length

  // ── Activity Stream ───────────────────────────────────────────────────

  const events: ActivityEvent[] = []

  // Expenses
  for (const e of (expensesRaw ?? []).slice(0, 5) as any[]) {
    const payer = participantMap.get(e.paid_by_participant_id)
    events.push({
      id: e.id,
      type: 'expense',
      emoji: '💶',
      title: e.title,
      subtitle: `${payer?.name ?? '?'} hat eingetragen`,
      rightText: formatCurrency(e.amount_cents),
      rightVariant: 'amount',
      href: `/trips/${tripId}/expenses`,
      timestamp: e.created_at,
      dotColor: 'green',
    })
  }

  // Activities
  for (const a of (activitiesRaw ?? []).slice(0, 3) as any[]) {
    const creator = participantMap.get(a.created_by_participant_id)
    const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type as ActivityType] ?? '✈️'
    events.push({
      id: a.id,
      type: 'activity',
      emoji,
      title: a.title,
      subtitle: `${creator?.name ?? '?'} hat vorgeschlagen`,
      rightText: null,
      rightVariant: 'arrow',
      href: `/trips/${tripId}/planen/${a.id}`,
      timestamp: a.created_at,
      dotColor: 'teal',
    })
  }

  // Packlist items
  for (const p of (packlistRaw ?? []).slice(0, 3) as any[]) {
    const creator = participantMap.get(p.created_by_participant_id)
    events.push({
      id: p.id,
      type: 'packlist',
      emoji: p.item_type === 'bringing' ? '🎒' : '🛍️',
      title: p.title,
      subtitle: `${creator?.name ?? '?'} zur Packliste`,
      rightText: null,
      rightVariant: 'arrow',
      href: `/trips/${tripId}/packlist`,
      timestamp: p.created_at,
      dotColor: 'blue',
    })
  }

  // Shopping items
  for (const s of (shoppingRaw ?? []).slice(0, 3) as any[]) {
    events.push({
      id: s.id,
      type: 'shopping',
      emoji: s.is_bought ? '✅' : '🛒',
      title: s.title,
      subtitle: s.is_bought ? 'Eingekauft' : 'Zum Einkaufszettel',
      rightText: s.is_bought ? '✓' : null,
      rightVariant: s.is_bought ? 'checked' : 'arrow',
      href: `/trips/${tripId}/einkauf`,
      timestamp: s.created_at,
      dotColor: 'amber',
    })
  }

  // Sort by timestamp desc, take 8
  const sortedEvents = events
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8)

  // ── Dot / icon color maps ─────────────────────────────────────────────

  const dotColors: Record<ActivityEvent['dotColor'], string> = {
    green:  'bg-green-500',
    teal:   'bg-primary',
    blue:   'bg-blue-500',
    amber:  'bg-amber-500',
    purple: 'bg-purple-500',
  }
  const iconBgs: Record<ActivityEvent['dotColor'], string> = {
    green:  'bg-green-50',
    teal:   'bg-primary/10',
    blue:   'bg-blue-50',
    amber:  'bg-amber-50',
    purple: 'bg-purple-50',
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <RealtimePageRefresher tripId={tripId} tables={['expenses', 'packlist_items', 'activities']} />

      {/* ── Balance Card ── */}
      <Link
        href={`/trips/${tripId}/settlement`}
        className="flex items-center gap-3.5 bg-card rounded-[16px] card-shadow border border-border border-l-4 border-l-green-500 px-4 py-3.5 active:scale-[0.98] transition-transform"
      >
        <div className="flex-shrink-0">
          <div className={cn(
            'text-[22px] font-black tracking-tight leading-none',
            (myBalance?.netBalanceCents ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'
          )}>
            {(myBalance?.netBalanceCents ?? 0) >= 0 ? '+' : ''}{formatCurrency(myBalance?.netBalanceCents ?? 0)}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">
            {(myBalance?.netBalanceCents ?? 0) >= 0 ? 'Dein Guthaben' : 'Du schuldest'}
          </div>
        </div>
        <div className="w-px h-9 bg-border flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-foreground">{formatCurrency(settlement.totalSpentCents)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{expenses.length} Ausgaben gesamt</div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </Link>

      {/* ── Ausflüge Card ── */}
      {(confirmedActivities.length > 0 || ideaCount > 0) && (
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
              {confirmedActivities.map((a: any) => {
                const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type as ActivityType] ?? '📍'
                return (
                  <Link
                    key={a.id}
                    href={`/trips/${tripId}/planen/${a.id}`}
                    className="flex items-center gap-2.5 py-2.5"
                  >
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
      )}

      {/* ── Split Card: Packliste + Einkauf ── */}
      <div className="flex gap-2.5">
        <Link
          href={`/trips/${tripId}/packlist`}
          className="flex-1 bg-card rounded-[18px] card-shadow border border-border p-3.5 block active:opacity-85 transition-opacity"
        >
          <div className="text-[22px] mb-2">🎒</div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Packliste</div>
          <div className="text-[20px] font-black text-foreground tracking-tight mb-2">
            {checkedCount}/{packlistTotal}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${packlistPct}%` }} />
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground mt-1.5">{packlistPct}% erledigt</div>
        </Link>

        <Link
          href={`/trips/${tripId}/einkauf`}
          className="flex-1 bg-card rounded-[18px] card-shadow border border-border p-3.5 block active:opacity-85 transition-opacity"
        >
          <div className="text-[22px] mb-2">🛒</div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Einkauf</div>
          <div className="text-[20px] font-black text-foreground tracking-tight mb-2">
            {shoppingOpenCount}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: shoppingOpenCount > 0 ? '100%' : '0%' }} />
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground mt-1.5">
            {shoppingOpenCount === 0 ? 'Alles erledigt' : 'Artikel noch offen'}
          </div>
        </Link>
      </div>

      {/* ── Aktivitäts-Stream ── */}
      <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-[14px] font-bold text-foreground">Letzte Aktivität</h2>
        </div>
        {sortedEvents.length === 0 ? (
          <div className="px-4 pb-4 text-[13px] text-muted-foreground">Noch keine Aktivitäten.</div>
        ) : (
          <div className="divide-y divide-border">
            {sortedEvents.map(event => (
              <Link
                key={event.id}
                href={event.href}
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
                <div className={cn(
                  'text-[13px] font-bold flex-shrink-0',
                  event.rightVariant === 'amount'  ? 'text-foreground' :
                  event.rightVariant === 'checked' ? 'text-green-600'  :
                  'text-muted-foreground'
                )}>
                  {event.rightVariant === 'arrow' ? (
                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  ) : event.rightText}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
