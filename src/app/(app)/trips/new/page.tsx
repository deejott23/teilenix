import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripForm from '@/components/trips/TripForm'
import PageHeader from '@/components/layout/PageHeader'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <PageHeader title="Neue Reise" backHref="/dashboard" />
      <TripForm />
    </div>
  )
}
