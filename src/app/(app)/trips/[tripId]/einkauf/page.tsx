import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingListClient from '@/components/shopping/ShoppingListClient'
import TripSubNav from '@/components/layout/TripSubNav'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'

export default async function EinkaufPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: itemsRaw } = await db
    .from('shopping_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  return (
    <>
      <RealtimePageRefresher tripId={tripId} tables={['shopping_items']} />
      <TripSubNav tripId={tripId} tabs={[
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
