import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import type { TripParticipant } from '@/types/app'

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
    .select('id, name, status, enabled_categories, custom_categories')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) notFound()
  if (trip.status === 'ended') redirect(`/trips/${tripId}/expenses`)

  // Get participants
  const { data: participantsRaw } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  const participants = (participantsRaw ?? []) as TripParticipant[]

  const myParticipant = participants.find(p => p.user_id === user.id)
  if (!myParticipant) redirect('/dashboard')
  const myParticipantId = myParticipant.id

  return (
    <div>
      <PageHeader
        title="Ausgabe hinzufügen"
        backHref={`/trips/${tripId}/expenses`}
      />
      <ExpenseForm
        tripId={tripId}
        participants={participants}
        myParticipantId={myParticipantId}
        myGroupId={myParticipant.group_id}
        enabledCategories={(trip.enabled_categories as string[] | null) ?? undefined}
        customCategoriesRaw={(trip.custom_categories as string[] | null) ?? []}
      />
    </div>
  )
}
