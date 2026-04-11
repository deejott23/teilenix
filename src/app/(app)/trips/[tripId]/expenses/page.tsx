import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ExpenseList from '@/components/expenses/ExpenseList'
import GeldSubNav from '@/components/layout/GeldSubNav'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/queryKeys'
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

  // Single round-trip: participants + expenses with splits joined
  const [{ data: participantsRaw }, { data: expensesRaw }] = await Promise.all([
    supabase.from('trip_participants').select('id, name, shares, user_id, group_id, is_group').eq('trip_id', tripId),
    (supabase as any).from('expenses').select('*, expense_splits(*)').eq('trip_id', tripId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('trips').select('status').eq('id', tripId).single(),
  ])

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))
  const myParticipantId = participants.find(p => p.user_id === user.id)?.id ?? ''

  const expenses = ((expensesRaw ?? []) as { id: string; paid_by_participant_id: string; expense_splits: { participant_id: string }[] }[])
    .map(e => ({
      ...e,
      expense_splits: (e.expense_splits ?? []).map(s => ({
        ...s,
        participant: participantMap.get(s.participant_id) ?? { id: s.participant_id, name: 'Unbekannt', shares: 1 },
      })),
      participant: participantMap.get(e.paid_by_participant_id) ?? { id: e.paid_by_participant_id, name: 'Unbekannt', shares: 1 },
    })) as unknown as ExpenseWithSplits[]

  // Fetch trip status (needed for UI) — already in the Promise.all above via index 2
  const { data: trip } = await supabase.from('trips').select('status').eq('id', tripId).maybeSingle()

  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.expenses.withSplits(tripId), expenses)
  const dehydratedState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="space-y-4">
        <RealtimeQueryRefresher tripId={tripId} tables={['expenses', 'expense_splits']} />
        <GeldSubNav tripId={tripId} />
        {trip?.status === 'active' && (
          <Link
            href={`/trips/${tripId}/expenses/new`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
            Neue Ausgabe
          </Link>
        )}
        <ExpenseList
          expenses={expenses}
          myParticipantId={myParticipantId}
          tripId={tripId}
          canEdit={trip?.status === 'active'}
          participantMap={participantMap}
        />
      </div>
    </HydrationBoundary>
  )
}
