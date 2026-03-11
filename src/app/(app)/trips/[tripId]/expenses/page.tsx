import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ExpenseList from '@/components/expenses/ExpenseList'
import type { ExpenseWithSplits } from '@/types/app'

export default async function ExpensesPage({
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
    .select('status')
    .eq('id', tripId)
    .single()

  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  const expenseIds = ((expensesRaw ?? []) as { id: string }[]).map(e => e.id)
  const { data: splitsRaw } = expenseIds.length > 0
    ? await supabase.from('expense_splits').select('*').in('expense_id', expenseIds)
    : { data: [] }

  const familyIds = [...new Set(((expensesRaw ?? []) as { paid_by_family: string }[]).map(e => e.paid_by_family))]
  const { data: familiesRaw } = familyIds.length > 0
    ? await supabase.from('families').select('*').in('id', familyIds)
    : { data: [] }
  const familiesMap = new Map(((familiesRaw ?? []) as { id: string }[]).map(f => [f.id, f]))

  const userIds = [...new Set(((expensesRaw ?? []) as { paid_by_user: string }[]).map(e => e.paid_by_user))]
  const { data: profilesRaw } = userIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] }
  const profilesMap = new Map(((profilesRaw ?? []) as { id: string }[]).map(p => [p.id, p]))

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
      profiles: profilesMap.get(e.paid_by_user) ?? { display_name: 'Unbekannt' },
    })) as unknown as ExpenseWithSplits[]

  const { data: memberData } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const myFamilyId = (memberData?.family_id as string) ?? ''

  return (
    <div className="space-y-4">
      {trip?.status === 'active' && (
        <Link href={`/trips/${tripId}/expenses/new`}>
          <Button className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Ausgabe hinzufügen
          </Button>
        </Link>
      )}

      <ExpenseList
        expenses={expenses}
        myFamilyId={myFamilyId}
        tripId={tripId}
        canEdit={trip?.status === 'active'}
      />
    </div>
  )
}
