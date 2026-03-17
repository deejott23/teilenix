import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpenseList from '@/components/expenses/ExpenseList'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trip status, participants, and expenses in parallel
  const [{ data: trip }, { data: participantsRaw }, { data: expensesRaw }] = await Promise.all([
    supabase.from('trips').select('status').eq('id', tripId).single(),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('*').eq('trip_id', tripId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const myParticipant = participants.find(p => p.user_id === user.id)
  const myParticipantId = myParticipant?.id ?? ''

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

  return (
    <div className="space-y-4">
      <ExpenseList
        expenses={expenses}
        myParticipantId={myParticipantId}
        tripId={tripId}
        canEdit={trip?.status === 'active'}
      />
    </div>
  )
}
