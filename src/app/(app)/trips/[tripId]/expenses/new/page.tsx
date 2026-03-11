import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import type { TripFamilyWithFamily } from '@/types/app'

export default async function NewExpensePage({
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
    .maybeSingle()

  if (!trip) notFound()
  if (trip.status === 'ended') redirect(`/trips/${tripId}/expenses`)

  // Get trip families with family details
  const { data: tripFamiliesRaw } = await supabase
    .from('trip_families')
    .select('id, trip_id, family_id, shares, joined_at')
    .eq('trip_id', tripId)

  const familyIds = ((tripFamiliesRaw ?? []) as { family_id: string }[]).map(tf => tf.family_id)
  const { data: familiesRaw } = familyIds.length > 0
    ? await supabase.from('families').select('*').in('id', familyIds)
    : { data: [] }

  const familiesMap = new Map(((familiesRaw ?? []) as { id: string }[]).map(f => [f.id, f]))

  const tripFamilies = ((tripFamiliesRaw ?? []) as { id: string; trip_id: string; family_id: string; shares: number; joined_at: string }[])
    .map(tf => ({ ...tf, families: familiesMap.get(tf.family_id) })) as unknown as TripFamilyWithFamily[]

  const { data: memberData } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!memberData) redirect('/onboarding')
  const myFamilyId = memberData.family_id as string

  return (
    <div>
      <PageHeader
        title="Ausgabe hinzufügen"
        backHref={`/trips/${tripId}/expenses`}
      />
      <ExpenseForm
        tripId={tripId}
        tripFamilies={tripFamilies}
        myFamilyId={myFamilyId}
      />
    </div>
  )
}
