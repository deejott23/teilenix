import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingListClient from '@/components/shopping/ShoppingListClient'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import { getTrip } from '@/lib/supabase/trips'
import { getUser } from '@/lib/supabase/user'

export default async function EinkaufPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // Redirect if packlist feature is disabled
  const tripMeta = await getTrip(tripId)
  if (tripMeta && !(tripMeta.show_packlist as boolean | null)) redirect(`/trips/${tripId}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: itemsRaw } = await db
    .from('shopping_items')
    .select('id, trip_id, title, category, quantity, is_bought, added_by_participant_id, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  return (
    <>
      <RealtimeQueryRefresher tripId={tripId} tables={['shopping_items']} />
      <TripSubNav tripId={tripId} variant="listen" tabs={[
        { href: '/packlist', label: '🎒 Packliste' },
        { href: '/einkauf',  label: '🛒 Einkaufszettel' },
      ]} />
      <ShoppingListClient
        tripId={tripId}
        initialItems={itemsRaw ?? []}
      />
    </>
  )
}
