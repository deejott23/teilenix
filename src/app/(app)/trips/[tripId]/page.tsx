import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BalanceSummaryCard from '@/components/dashboard/BalanceSummaryCard'
import ParticipantBalanceRow from '@/components/dashboard/ParticipantBalanceRow'
import EndTripButton from '@/components/trips/EndTripButton'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency, formatDate } from '@/lib/formatting'
import { Calendar, Users } from 'lucide-react'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

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

  // Participants in this trip
  const { data: participantsRaw } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  // Expenses
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

  // My participant entry
  const myParticipant = participants.find(p => p.user_id === user.id)
  const myParticipantId = myParticipant?.id ?? ''

  const settlement  = computeSettlement(expenses, participants)
  const myBalance   = settlement.balances.find(b => b.participantId === myParticipantId)
  const isActive    = trip.status === 'active'

  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date as string)} – ${formatDate(trip.end_date as string)}`
    : trip.start_date ? `ab ${formatDate(trip.start_date as string)}` : null

  return (
    <div className="space-y-5">

      {/* Trip meta strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {dateRange && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
              {dateRange}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" strokeWidth={2} />
            {participants.length} Teilnehmer
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {isActive ? '● Aktiv' : 'Abgeschlossen'}
          </span>
        </div>
      </div>

      {/* My balance */}
      {myBalance && (
        <BalanceSummaryCard
          balance={myBalance}
          totalSpentCents={settlement.totalSpentCents}
        />
      )}

      {/* No expenses yet */}
      {expenses.length === 0 && (
        <div className="bg-card rounded-[18px] card-shadow p-8 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="font-semibold text-foreground mb-1">Noch keine Ausgaben</p>
          <p className="text-sm text-muted-foreground">
            {isActive ? 'Tippe unten auf „Ausgabe" um die erste einzutragen.' : 'Diese Reise hat keine Ausgaben.'}
          </p>
        </div>
      )}

      {/* Participants + balances */}
      {settlement.balances.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
              Teilnehmer
            </h2>
            <span className="text-[12px] font-semibold text-muted-foreground">
              {formatCurrency(settlement.totalSpentCents)} gesamt
            </span>
          </div>
          <div className="space-y-2.5">
            {settlement.balances.map(balance => (
              <ParticipantBalanceRow
                key={balance.participantId}
                balance={balance}
                isOwnParticipant={balance.participantId === myParticipantId}
              />
            ))}
          </div>
        </section>
      )}

      {/* End trip — only for creator, at the bottom */}
      {isActive && trip.created_by === user.id && (
        <div className="pt-2">
          <EndTripButton tripId={tripId} />
        </div>
      )}

    </div>
  )
}
