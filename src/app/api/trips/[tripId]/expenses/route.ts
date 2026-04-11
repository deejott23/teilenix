import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

/**
 * GET /api/trips/[tripId]/expenses
 * Gibt alle Ausgaben mit Splits zurück — wird von TanStack Query für Client-side Refetches verwendet.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: participantsRaw }, { data: expensesRaw }] = await Promise.all([
    supabase.from('trip_participants').select('id, name, shares, user_id, group_id, is_group').eq('trip_id', tripId),
    // Single query — expense_splits joined via FK
    (supabase as any).from('expenses').select('*, expense_splits(*)').eq('trip_id', tripId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const expenses = ((expensesRaw ?? []) as { id: string; paid_by_participant_id: string; expense_splits: { participant_id: string }[] }[])
    .map(e => ({
      ...e,
      expense_splits: (e.expense_splits ?? []).map(s => ({
        ...s,
        participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
      })),
      participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
    })) as unknown as ExpenseWithSplits[]

  return NextResponse.json(expenses)
}
