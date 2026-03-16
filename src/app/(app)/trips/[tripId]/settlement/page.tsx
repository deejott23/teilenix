import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeSettlement } from '@/lib/settlement'
import SettlementTransferList from '@/components/settlement/SettlementTransferList'
import BalanceTable from '@/components/settlement/BalanceTable'
import SettlementExportButton from '@/components/settlement/SettlementExportButton'
import ExpenseDetailReport from '@/components/settlement/ExpenseDetailReport'
import EndTripButton from '@/components/trips/EndTripButton'
import { formatCurrency } from '@/lib/formatting'
import { CheckCircle } from 'lucide-react'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

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
    .select('id, name, status, created_by')
    .eq('id', tripId)
    .single()

  // Load participants
  const { data: participantsRaw } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

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

  const expenses = ((expensesRaw ?? []) as { id: string; paid_by_participant_id: string }[])
    .map(e => ({
      ...e,
      expense_splits: ((splitsByExpense.get(e.id) ?? []) as { participant_id: string }[]).map(s => ({
        ...s,
        participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
      })),
      participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
    })) as unknown as ExpenseWithSplits[]

  const settlement = computeSettlement(expenses, participants)
  const isActive = trip?.status === 'active'
  const isCreator = trip?.created_by === user.id

  return (
    <div className="space-y-5">

      {/* Summary header */}
      <div className="bg-card card-shadow rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">
                {isActive ? 'Vorläufige Abrechnung' : 'Abrechnung'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Gesamt ausgegeben:{' '}
              <span className="font-semibold text-foreground">
                {formatCurrency(settlement.totalSpentCents)}
              </span>
              {' · '}
              {settlement.transfers.length === 0
                ? 'Alles ausgeglichen ✓'
                : `${settlement.transfers.length} Überweisung${settlement.transfers.length > 1 ? 'en' : ''} nötig`
              }
            </p>
          </div>
          {isActive && isCreator && (
            <div className="flex-shrink-0">
              <EndTripButton tripId={tripId} />
            </div>
          )}
        </div>
      </div>

      {/* Who pays whom */}
      <div>
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Wer zahlt wem?
        </h3>
        <SettlementTransferList transfers={settlement.transfers} />
      </div>

      {/* Balance per participant */}
      <div>
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Übersicht je Teilnehmer
        </h3>
        <BalanceTable balances={settlement.balances} />
      </div>

      {/* Expense detail report — collapsible */}
      <div>
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Ausgaben im Detail
        </h3>
        <ExpenseDetailReport expenses={expenses} participantMap={participantMap} />
      </div>

      <SettlementExportButton
        tripName={(trip?.name as string) ?? 'Reise'}
        settlement={settlement}
      />
    </div>
  )
}
