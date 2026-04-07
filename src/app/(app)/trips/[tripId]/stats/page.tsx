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

  // Fetch everything in parallel
  const [{ data: participantsRaw }, { data: expensesRaw }, { data: packlistRaw }] = await Promise.all([
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('*').eq('trip_id', tripId).order('expense_date', { ascending: true }),
    supabase.from('packlist_items').select('*').eq('trip_id', tripId),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  // Fetch claims for this trip's packlist items
  type PacklistRow = { id: string; created_by_participant_id: string; item_type: string; title: string }
  const packlistItems = (packlistRaw ?? []) as unknown as PacklistRow[]
  const packlistItemIds = packlistItems.map(i => i.id)
  const { data: claimsRaw } = packlistItemIds.length > 0
    ? await supabase.from('packlist_claims').select('*').in('item_id', packlistItemIds)
    : { data: [] }

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
  // Exclude payment entries from expense stats
  const realExpenseRows = expenseRows.filter(e => e.category !== 'payment')

  const expenses = expenseRows.map(e => ({
    ...e,
    expense_splits: ((splitsByExpense.get(e.id) ?? []) as { participant_id: string }[]).map(s => ({
      ...s,
      participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
    })),
    participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
  })) as unknown as ExpenseWithSplits[]

  const settlement = computeSettlement(expenses, participants)

  // Category spending (exclude payments)
  const categoryTotals = new Map<string, number>()
  realExpenseRows.forEach(e => {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount_cents)
  })
  const categoryData = [...categoryTotals.entries()]
    .map(([cat, cents]) => ({
      name: categoryLabels[cat as keyof typeof categoryLabels] ?? cat,
      value: cents
    }))
    .sort((a, b) => b.value - a.value)

  // Spending over time (cumulative, exclude payments)
  let cumulative = 0
  const timeData = realExpenseRows.map(e => {
    cumulative += e.amount_cents
    return { date: e.expense_date, cumulative, amount: e.amount_cents }
  })

  // Expense leaderboards
  const mostGenerous = [...settlement.balances].sort((a, b) => b.totalPaidCents - a.totalPaidCents)
  const mostDebt = [...settlement.balances].sort((a, b) => a.netBalanceCents - b.netBalanceCents)

  const expenseCountByParticipant = new Map<string, number>()
  realExpenseRows.forEach(e => {
    expenseCountByParticipant.set(e.paid_by_participant_id, (expenseCountByParticipant.get(e.paid_by_participant_id) ?? 0) + 1)
  })
  const mostExpenses = participants.map(p => ({
    participantId: p.id,
    participantName: p.name,
    count: expenseCountByParticipant.get(p.id) ?? 0,
  })).sort((a, b) => b.count - a.count)

  // ── Packliste stats ──
  // Who brings the most (bringing type)
  const bringingByParticipant = new Map<string, number>()
  packlistItems.filter(i => i.item_type === 'bringing').forEach(i => {
    bringingByParticipant.set(i.created_by_participant_id, (bringingByParticipant.get(i.created_by_participant_id) ?? 0) + 1)
  })
  const mostBringing = participants
    .map(p => ({ participantId: p.id, participantName: p.name, count: bringingByParticipant.get(p.id) ?? 0 }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)

  // Who claims the most group items
  type ClaimRow = { participant_id: string; quantity_claimed: number }
  const claimItems = (claimsRaw ?? []) as unknown as ClaimRow[]
  const claimsByParticipant = new Map<string, number>()
  claimItems.forEach(c => {
    claimsByParticipant.set(c.participant_id, (claimsByParticipant.get(c.participant_id) ?? 0) + c.quantity_claimed)
  })
  const mostClaims = participants
    .map(p => ({ participantId: p.id, participantName: p.name, count: claimsByParticipant.get(p.id) ?? 0 }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)

  // Most private items (group_private)
  const privateByParticipant = new Map<string, number>()
  packlistItems.filter(i => i.item_type === 'group_private').forEach(i => {
    privateByParticipant.set(i.created_by_participant_id, (privateByParticipant.get(i.created_by_participant_id) ?? 0) + 1)
  })
  const mostPrivate = participants
    .map(p => ({ participantId: p.id, participantName: p.name, count: privateByParticipant.get(p.id) ?? 0 }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)

  const hasPacklistData = packlistItems.length > 0

  return (
    <div className="space-y-6">
      <div className="bg-card card-shadow rounded-2xl p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">Gesamtausgaben</p>
        <p className="text-3xl font-bold text-foreground">{formatCurrency(settlement.totalSpentCents)}</p>
        <p className="text-sm text-muted-foreground/60 mt-1">{realExpenseRows.length} Ausgaben</p>
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
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">💰 Ausgaben-Bestenliste</h3>
          <div className="space-y-3">
            <LeaderboardCard
              title="Großzügigster Zahler"
              emoji="💸"
              items={mostGenerous.filter(b => b.totalPaidCents > 0).map(b => ({
                label: b.participantName,
                value: formatCurrency(b.totalPaidCents),
                highlight: mostGenerous[0]?.participantId === b.participantId,
              }))}
            />
            <LeaderboardCard
              title="Fleißigster Buchhalter"
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

      {hasPacklistData && (
        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">🎒 Packliste-Bestenliste</h3>
          <div className="space-y-3">
            {mostBringing.length > 0 && (
              <LeaderboardCard
                title="Packweltmeister"
                emoji="🎒"
                items={mostBringing.map((b, i) => ({
                  label: b.participantName,
                  value: `${b.count} Item${b.count === 1 ? '' : 's'}`,
                  highlight: i === 0,
                }))}
              />
            )}
            {mostClaims.length > 0 && (
              <LeaderboardCard
                title="Hilfsbereiteste Person"
                emoji="🙋"
                items={mostClaims.map((b, i) => ({
                  label: b.participantName,
                  value: `${b.count}× zugesagt`,
                  highlight: i === 0,
                }))}
              />
            )}
            {mostPrivate.length > 0 && (
              <LeaderboardCard
                title="Geheimniskrämerln"
                emoji="🕵️"
                items={mostPrivate.map((b, i) => ({
                  label: b.participantName,
                  value: `${b.count} geheime${b.count === 1 ? 's' : ''} Item${b.count === 1 ? '' : 's'}`,
                  highlight: i === 0,
                }))}
              />
            )}
            <div className="bg-card card-shadow rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                🧳 {packlistItems.length} Item{packlistItems.length === 1 ? '' : 's'} auf der Packliste
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                davon {packlistItems.filter(i => i.item_type === 'bringing').length} mitgebracht,{' '}
                {packlistItems.filter(i => i.item_type === 'group_need').length} gesucht,{' '}
                {packlistItems.filter(i => i.item_type === 'group_private').length} privat
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
