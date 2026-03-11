import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import SpendingByCategoryChart from '@/components/stats/SpendingByCategoryChart'
import LeaderboardCard from '@/components/stats/LeaderboardCard'
import SpendingOverTimeChart from '@/components/stats/SpendingOverTimeChart'
import type { ExpenseWithSplits, TripFamilyWithFamily } from '@/types/app'

export default async function StatsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tripFamiliesRaw } = await supabase
    .from('trip_families')
    .select('*')
    .eq('trip_id', tripId)

  const familyIds = ((tripFamiliesRaw ?? []) as { family_id: string }[]).map(tf => tf.family_id)
  const { data: familiesRaw } = familyIds.length > 0
    ? await supabase.from('families').select('*').in('id', familyIds)
    : { data: [] }
  const familiesMap = new Map(((familiesRaw ?? []) as { id: string }[]).map(f => [f.id, f]))

  const tripFamilies = ((tripFamiliesRaw ?? []) as { id: string; trip_id: string; family_id: string; shares: number; joined_at: string }[])
    .map(tf => ({ ...tf, families: familiesMap.get(tf.family_id) })) as unknown as TripFamilyWithFamily[]

  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('expense_date', { ascending: true })

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

  type ExpenseRow = { id: string; category: string; amount_cents: number; expense_date: string; paid_by_family: string }
  const expenseRows = (expensesRaw ?? []) as unknown as ExpenseRow[]

  const expenses = expenseRows.map(e => ({
    ...e,
    expense_splits: splitsByExpense.get(e.id) ?? [],
    families: familiesMap.get(e.paid_by_family) ?? { name: 'Unbekannt' },
    profiles: { display_name: 'Unbekannt' },
  })) as unknown as ExpenseWithSplits[]

  const settlement = computeSettlement(expenses, tripFamilies)

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
  const mostExpenses = tripFamilies.map(tf => ({
    familyId: tf.family_id,
    familyName: tf.families.name,
    count: expenseRows.filter(e => e.paid_by_family === tf.family_id).length,
  })).sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-emerald-50 rounded-2xl p-5 text-center">
        <p className="text-sm text-gray-500 mb-1">Gesamtausgaben</p>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(settlement.totalSpentCents)}</p>
        <p className="text-sm text-gray-400 mt-1">{expenseRows.length} Ausgaben</p>
      </div>

      {categoryData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Nach Kategorie</h3>
          <SpendingByCategoryChart data={categoryData} />
        </div>
      )}

      {timeData.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ausgaben über Zeit</h3>
          <SpendingOverTimeChart data={timeData} />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🏆 Bestenliste</h3>
        <div className="space-y-3">
          <LeaderboardCard
            title="Großzügigste Familie"
            emoji="💸"
            items={mostGenerous.map(b => ({
              label: b.familyName,
              value: formatCurrency(b.totalPaidCents),
              highlight: mostGenerous[0]?.familyId === b.familyId,
            }))}
          />
          <LeaderboardCard
            title="Meiste Ausgaben erfasst"
            emoji="📋"
            items={mostExpenses.map(b => ({
              label: b.familyName,
              value: `${b.count} Ausgaben`,
              highlight: mostExpenses[0]?.familyId === b.familyId,
            }))}
          />
          {mostDebt[0]?.netBalanceCents < 0 && (
            <LeaderboardCard
              title="Größte Schulden"
              emoji="🔴"
              items={mostDebt.filter(b => b.netBalanceCents < 0).map(b => ({
                label: b.familyName,
                value: formatCurrency(Math.abs(b.netBalanceCents)),
                highlight: false,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
