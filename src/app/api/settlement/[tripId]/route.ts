import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { computeSettlement } from '@/lib/settlement'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Fetch participants
  const { data: participantsRaw, error: participantsError } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)

  if (participantsError || !participantsRaw) {
    return NextResponse.json({ error: 'Teilnehmer konnten nicht geladen werden' }, { status: 500 })
  }

  const participants = participantsRaw as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  // Fetch all expenses with splits
  const { data: expensesRaw, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)

  if (expensesError) {
    return NextResponse.json({ error: 'Ausgaben konnten nicht geladen werden' }, { status: 500 })
  }

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

  const result = computeSettlement(expenses, participants)

  return NextResponse.json(result)
}
