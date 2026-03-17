import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import type { ExpenseSplitInput, TripParticipant, CoPayerEntry } from '@/types/app'

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ tripId: string; expenseId: string }>
}) {
  const { tripId, expenseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('id, name, status')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) notFound()
  if (trip.status === 'ended') redirect(`/trips/${tripId}/expenses`)

  const { data: expense } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .eq('trip_id', tripId)
    .maybeSingle()

  if (!expense) notFound()

  const { data: splitsRaw } = await supabase
    .from('expense_splits')
    .select('*')
    .eq('expense_id', expenseId)

  // Trip participants
  const { data: participantsRaw } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  const participants = (participantsRaw ?? []) as TripParticipant[]

  const myParticipant = participants.find(p => p.user_id === user.id)
  if (!myParticipant) redirect('/dashboard')
  const myParticipantId = myParticipant.id

  // Build initial splits from existing expense_splits
  type SplitRow = { participant_id: string; shares: number }
  const existingSplits = (splitsRaw ?? []) as SplitRow[]
  const initialSplits: ExpenseSplitInput[] = participants.map(p => {
    const s = existingSplits.find(sp => sp.participant_id === p.id)
    return {
      participantId: p.id,
      participantName: p.name,
      shares: s?.shares ?? p.shares,
      included: !!s,
    }
  })

  // Format amount back to euros string (e.g. 1250 → "12,50")
  const amountCents = (expense as { amount_cents: number }).amount_cents
  const amountEuros = (amountCents / 100).toFixed(2).replace('.', ',')

  // Determine split mode: custom if not all participants included
  const allIncluded = participants.every(p => existingSplits.some(s => s.participant_id === p.id))
  const splitMode: 'proportional' | 'custom' = allIncluded ? 'proportional' : 'custom'

  const expenseRow = expense as { paid_by_participant_id: string; category: string; expense_date: string; title: string; co_payers?: CoPayerEntry[] | null }

  return (
    <div>
      <PageHeader
        title="Ausgabe bearbeiten"
        backHref={`/trips/${tripId}/expenses`}
      />
      <ExpenseForm
        tripId={tripId}
        participants={participants}
        myParticipantId={myParticipantId}
        expenseId={expenseId}
        initialData={{
          title:               expenseRow.title,
          amountEuros,
          category:            expenseRow.category ?? 'other',
          expenseDate:         expenseRow.expense_date,
          paidByParticipantId: expenseRow.paid_by_participant_id,
          coPayers:            expenseRow.co_payers ?? [],
          splitMode,
          splits:              initialSplits,
        }}
      />
    </div>
  )
}
