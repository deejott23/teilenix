import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TripCard from '@/components/trips/TripCard'
import PageHeader from '@/components/layout/PageHeader'
import type { Trip } from '@/types/app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!familyMember) redirect('/onboarding')

  const familyId = familyMember.family_id as string

  // Get trip IDs for this family
  const { data: tripFamilies } = await supabase
    .from('trip_families')
    .select('trip_id')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: false })

  const tripIds = (tripFamilies ?? []).map((tf: { trip_id: string }) => tf.trip_id)

  // Fetch actual trips
  const { data: tripsRaw } = tripIds.length > 0
    ? await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const trips = (tripsRaw ?? []) as Trip[]
  const activeTrips = trips.filter(t => t.status === 'active')
  const endedTrips = trips.filter(t => t.status === 'ended')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <PageHeader
        title={`Hallo, ${(profile?.display_name as string)?.split(' ')[0] ?? 'du'}! 👋`}
        subtitle="Deine Reisen auf einen Blick"
        action={
          <Link href="/trips/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Neue Reise
            </Button>
          </Link>
        }
      />

      {trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Noch keine Reisen</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Erstelle deine erste Reise oder lass dich von jemandem einladen.
          </p>
          <Link href="/trips/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Erste Reise erstellen
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTrips.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Aktive Reisen
              </h2>
              <div className="space-y-3">
                {activeTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} familyId={familyId} />
                ))}
              </div>
            </section>
          )}

          {endedTrips.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Abgeschlossene Reisen
              </h2>
              <div className="space-y-3">
                {endedTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} familyId={familyId} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
