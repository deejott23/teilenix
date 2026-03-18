import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import SpendingByCategoryChart from '@/components/stats/SpendingByCategoryChart'
import LeaderboardCard from '@/components/stats/LeaderboardCard'
import SpendingOverTimeChart from '@/components/stats/SpendingOverTimeChart'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

export default async function StatsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch participants and expenses in parallel
  const [{ data: participantsRaw }, { data: expensesRaw }] = await Promise.all([
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('*').eq('trip_id', tripId).order('expense_date', { ascending: true }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const expenseIds = ((expensesRaw ?? []) as { id: string }[]).map(e => e.id)
  const { data: splitsRaw } = expenseIds.length > 0
    ? await supabase.from('expense_splits').select('*').in('expense_id', expenseIds)
    : { data: [] }

  const splitsByExpense = new Map<string, unknown[]>()
  ;((splitsRaw ?? []) as { expense_id: string }[]).forEach(s => {
    const arr = splitsByExpense.get(s.expense_id) ?? []
    arr.push(s)
    splitsByExpense.set(s.expense_id, arr)
  })

  type ExpenseRow = { id: string; category: string; amount_cents: number; expense_date: string; paid_by_participant_id: string }
  const expenseRows = (expensesRaw ?? []) as unknown as ExpenseRow[]

  const expenses = expenseRows.map(e => ({
    ...e,
    expense_splits: ((splitsByExpense.get(e.id) ?? []) as { participant_id: string }[]).map(s => ({
      ...s,
      participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
    })),
    participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
  })) as unknown as ExpenseWithSplits[]

  const settlement = computeSettlement(expenses, participants)

  // Category spending
  const categoryTotals = new Map<string, number>()
  expenseRows.forEach(e => {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount_cents)
  })
  const categoryData = [...categoryTotals.entries()]
    .map(([cat, cents]) => ({
      name: categoryLabels[cat as keyof typeof categoryLabels] ?? cat,
      value: cents
    }))
    .sort((a, b) => b.value - a.value)

  // Spending over time (cumulative)
  let cumulative = 0
  const timeData = expenseRows.map(e => {
    cumulative += e.amount_cents
    return { date: e.expense_date, cumulative, amount: e.amount_cents }
  })

  // Leaderboard
  const mostGenerous = [...settlement.balances].sort((a, b) => b.totalPaidCents - a.totalPaidCents)
  const mostDebt = [...settlement.balances].sort((a, b) => a.netBalanceCents - b.netBalanceCents)

  // O(n) count via Map instead of O(n*m) filter per participant
  const expenseCountByParticipant = new Map<string, number>()
  expenseRows.forEach(e => {
    expenseCountByParticipant.set(e.paid_by_participant_id, (expenseCountByParticipant.get(e.paid_by_participant_id) ?? 0) + 1)
  })
  const mostExpenses = participants.map(p => ({
    participantId: p.id,
    participantName: p.name,
    count: expenseCountByParticipant.get(p.id) ?? 0,
  })).sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-6">
      <div className="bg-card card-shadow rounded-2xl p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">Gesamtausgaben</p>
        <p className="text-3xl font-bold text-foreground">{formatCurrency(settlement.totalSpentCents)}</p>
        <p className="text-sm text-muted-foreground/60 mt-1">{expenseRows.length} Ausgaben</p>
      </div>

      {categoryData.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Nach Kategorie</h3>
          <SpendingByCategoryChart data={categoryData} />
        </div>
      )}

      {timeData.length > 1 && (
        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Ausgaben über Zeit</h3>
          <SpendingOverTimeChart data={timeData} />
        </div>
      )}

      {settlement.totalSpentCents > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Bestenliste</h3>
          <div className="space-y-3">
            <LeaderboardCard
              title="Großzügigster Teilnehmer"
              emoji="💸"
              items={mostGenerous.filter(b => b.totalPaidCents > 0).map(b => ({
                label: b.participantName,
                value: formatCurrency(b.totalPaidCents),
                highlight: mostGenerous[0]?.participantId === b.participantId,
              }))}
            />
            <LeaderboardCard
              title="Meiste Ausgaben erfasst"
              emoji="📋"
              items={mostExpenses.filter(b => b.count > 0).map(b => ({
                label: b.participantName,
                value: `${b.count} Ausgabe${b.count === 1 ? '' : 'n'}`,
                highlight: mostExpenses[0]?.participantId === b.participantId && b.count > 0,
              }))}
            />
            {mostDebt[0]?.netBalanceCents < 0 && (
              <LeaderboardCard
                title="Größte Schulden"
                emoji="🔴"
                items={mostDebt.filter(b => b.netBalanceCents < 0).map(b => ({
                  label: b.participantName,
                  value: formatCurrency(Math.abs(b.netBalanceCents)),
                  highlight: false,
                }))}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
