import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import { getParticipants } from '@/lib/supabase/trips'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

export default async function BalanceCard({
  tripId,
  myParticipantId,
}: {
  tripId: string
  myParticipantId: string
}) {
  const supabase = await createClient()

  // Single round-trip: participants (cached) + expenses with splits joined
  const [participants, { data: expensesRaw }] = await Promise.all([
    getParticipants(tripId),
    supabase.from('expenses').select('*, expense_splits(*)').eq('trip_id', tripId)
      .order('created_at', { ascending: false }),
  ])

  const participantMap = new Map(participants.map((p: TripParticipant) => [p.id, p]))

  const expenses = ((expensesRaw ?? []) as Array<{
    id: string
    paid_by_participant_id: string
    expense_splits: Array<{ participant_id: string }>
  }>).map(e => ({
    ...e,
    expense_splits: (e.expense_splits ?? []).map(s => ({
      ...s,
      participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
    })),
    participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
  })) as unknown as ExpenseWithSplits[]

  const settlement = computeSettlement(expenses, participants)
  const myBalance = settlement.balances.find(b => b.participantId === myParticipantId)
  const realExpenses = expenses.filter(e => (e as unknown as { category: string }).category !== 'payment')
  const lastTwo = realExpenses.slice(0, 2)

  return (
    <div className="bg-card rounded-[16px] card-shadow border border-border border-l-4 border-l-green-500 overflow-hidden">
      {/* Balance summary row */}
      <Link
        href={`/trips/${tripId}/settlement`}
        className="flex items-center gap-3.5 px-4 py-3.5 active:scale-[0.98] transition-transform"
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
          <div className="text-[11px] text-muted-foreground mt-0.5">{realExpenses.length} Ausgaben gesamt</div>
        </div>
        <Icon name="chevron-right" size={16} className="text-muted-foreground flex-shrink-0" />
      </Link>

      {/* Last 2 expenses */}
      {lastTwo.length > 0 && (
        <div className="border-t border-border">
          {lastTwo.map((expense) => {
            const e = expense as unknown as { id: string; title: string; amount_cents: number; paid_by_participant_id: string; category: string }
            const payer = participantMap.get(e.paid_by_participant_id)
            return (
              <Link
                key={e.id}
                href={`/trips/${tripId}/expenses`}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/40 active:bg-muted transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-[13px] flex-shrink-0">💶</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-foreground truncate">{e.title}</div>
                  <div className="text-[10px] text-muted-foreground">{payer?.name ?? '?'}</div>
                </div>
                <div className="text-[12px] font-bold text-foreground flex-shrink-0">
                  {formatCurrency(e.amount_cents)}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function BalanceCardSkeleton() {
  return (
    <div className="bg-card rounded-[16px] card-shadow border border-border border-l-4 border-l-green-500/30 overflow-hidden">
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="flex-shrink-0 space-y-1.5">
          <div className="h-7 w-20 bg-muted animate-pulse rounded-lg" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="w-px h-9 bg-border flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
