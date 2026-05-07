import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

export default async function BalanceCard({
  tripId,
  myParticipantId,
}: {
  tripId: string
  myParticipantId: string
}) {
  const supabase = await createClient()

  const [{ data: participantsRaw }, { data: allExpensesRaw }] = await Promise.all([
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('*').eq('trip_id', tripId),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

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

  const settlement = computeSettlement(expenses, participants)
  const myBalance = settlement.balances.find(b => b.participantId === myParticipantId)
  const realExpenseCount = expenses.filter(e => (e as unknown as { category: string }).category !== 'payment').length

  return (
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
        <div className="text-[11px] text-muted-foreground mt-0.5">{realExpenseCount} Ausgaben gesamt</div>
      </div>
      <Icon name="chevron-right" size={16} className="text-muted-foreground flex-shrink-0" />
    </Link>
  )
}

export function BalanceCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 bg-card rounded-[16px] card-shadow border border-border border-l-4 border-l-green-500/30 px-4 py-3.5">
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
  )
}
