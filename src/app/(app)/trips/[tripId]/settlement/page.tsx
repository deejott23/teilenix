import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeSettlement } from '@/lib/settlement'
import SettlementTransferList from '@/components/settlement/SettlementTransferList'
import BalanceTable from '@/components/settlement/BalanceTable'
import SettlementExportButton from '@/components/settlement/SettlementExportButton'
import { formatCurrency } from '@/lib/formatting'
import { CheckCircle } from 'lucide-react'
import type { ExpenseWithSplits, TripFamilyWithFamily } from '@/types/app'

export default async function SettlementPage({
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
    .select('id, name, status')
    .eq('id', tripId)
    .single()

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

  const expenses = ((expensesRaw ?? []) as { id: string; paid_by_family: string; paid_by_user: string }[])
    .map(e => ({
      ...e,
      expense_splits: splitsByExpense.get(e.id) ?? [],
      families: familiesMap.get(e.paid_by_family) ?? { name: 'Unbekannt' },
      profiles: { display_name: 'Unbekannt' },
    })) as unknown as ExpenseWithSplits[]

  const settlement = computeSettlement(expenses, tripFamilies)

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-primary/10 to-emerald-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-gray-900">
            {trip?.status === 'ended' ? 'Abrechnung' : 'Vorläufige Abrechnung'}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Gesamt ausgegeben:{' '}
          <span className="font-semibold text-gray-800">
            {formatCurrency(settlement.totalSpentCents)}
          </span>
          {' · '}
          {settlement.transfers.length === 0
            ? 'Alles ausgeglichen ✓'
            : `${settlement.transfers.length} Überweisung${settlement.transfers.length > 1 ? 'en' : ''} nötig`
          }
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Wer zahlt wem?</h3>
        <SettlementTransferList transfers={settlement.transfers} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Detaillierte Übersicht</h3>
        <BalanceTable balances={settlement.balances} />
      </div>

      <SettlementExportButton
        tripName={(trip?.name as string) ?? 'Reise'}
        settlement={settlement}
      />
    </div>
  )
}
