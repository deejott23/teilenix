import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Share2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BalanceSummaryCard from '@/components/dashboard/BalanceSummaryCard'
import FamilyBalanceRow from '@/components/dashboard/FamilyBalanceRow'
import TripInvitePanel from '@/components/trips/TripInvitePanel'
import EndTripButton from '@/components/trips/EndTripButton'
import { computeSettlement } from '@/lib/settlement'
import { formatCurrency } from '@/lib/formatting'
import type { ExpenseWithSplits, TripFamilyWithFamily } from '@/types/app'

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

  // Get trip families
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

  // Get expenses
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

  // User's family
  const { data: memberData } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const myFamilyId = (memberData?.family_id as string) ?? ''

  const settlement = computeSettlement(expenses, tripFamilies)
  const myBalance = settlement.balances.find(b => b.familyId === myFamilyId)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            className={
              trip.status === 'active'
                ? 'bg-primary/10 text-primary border-0 hover:bg-primary/20'
                : 'bg-gray-100 text-gray-600 border-0'
            }
          >
            {trip.status === 'active' ? 'Aktive Reise' : 'Abgeschlossen'}
          </Badge>
          <span className="text-sm text-gray-500">
            {tripFamilies.length} Familie{tripFamilies.length !== 1 ? 'n' : ''}
          </span>
        </div>
        {trip.status === 'active' && trip.created_by === user.id && (
          <EndTripButton tripId={tripId} />
        )}
      </div>

      {myBalance && (
        <BalanceSummaryCard
          balance={myBalance}
          totalSpentCents={settlement.totalSpentCents}
        />
      )}

      {trip.status === 'active' && (
        <Link href={`/trips/${tripId}/expenses/new`}>
          <Button className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Ausgabe hinzufügen
          </Button>
        </Link>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Familien-Übersicht</h2>
          <span className="ml-auto text-xs text-gray-400">
            Gesamt: {formatCurrency(settlement.totalSpentCents)}
          </span>
        </div>
        <div className="space-y-2">
          {settlement.balances.map(balance => (
            <FamilyBalanceRow
              key={balance.familyId}
              balance={balance}
              isOwnFamily={balance.familyId === myFamilyId}
            />
          ))}
        </div>
      </div>

      {trip.status === 'active' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Andere einladen</h2>
          </div>
          <TripInvitePanel inviteCode={trip.invite_code as string} tripId={tripId} />
        </div>
      )}
    </div>
  )
}
