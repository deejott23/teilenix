import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripForm from '@/components/trips/TripForm'
import PageHeader from '@/components/layout/PageHeader'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!familyMember) redirect('/onboarding')

  return (
    <div>
      <PageHeader title="Neue Reise" backHref="/dashboard" />
      <TripForm />
    </div>
  )
}
