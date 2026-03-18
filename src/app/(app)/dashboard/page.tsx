import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TripCard from '@/components/trips/TripCard'
import JoinWithCodeButton from '@/components/trips/JoinWithCodeButton'
import CollapsibleEndedTrips from '@/components/trips/CollapsibleEndedTrips'
import type { Trip } from '@/types/app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: participantRows }, { data: profile }] = await Promise.all([
    supabase.from('trip_participants').select('trip_id').eq('user_id', user.id).order('joined_at', { ascending: false }),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ])

  const tripIds = (participantRows ?? []).map((p: { trip_id: string }) => p.trip_id)
  const firstName = (profile?.display_name as string)?.split(' ')[0] ?? 'du'

  const { data: tripsRaw } = tripIds.length > 0
    ? await supabase.from('trips').select('*').in('id', tripIds).order('created_at', { ascending: false })
    : { data: [] }

  const trips       = (tripsRaw ?? []) as Trip[]
  const activeTrips = trips.filter(t => t.status === 'active')
  const endedTrips  = trips.filter(t => t.status === 'ended')

  return (
    <div>

      {/* Teal header — greeting only, no buttons → no wrapping issue */}
      <div
        className="-mx-4 -mt-7 mb-6 px-6 pt-8 pb-7 rounded-b-3xl"
        style={{ background: 'linear-gradient(150deg, #1b5c58 0%, #134844 100%)' }}
      >
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          TeileniX
        </p>
        <h1 className="text-[26px] font-extrabold tracking-tight text-white leading-tight">
          Hallo, {firstName} 👋
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {activeTrips.length > 0
            ? `${activeTrips.length} aktive ${activeTrips.length === 1 ? 'Reise' : 'Reisen'}`
            : trips.length > 0 ? 'Keine aktiven Reisen' : 'Noch keine Reisen'}
        </p>
      </div>

      <div className="space-y-6">

        {/* Action buttons */}
        <div className="space-y-2.5">
          <Link
            href="/trips/new"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30"
          >
            <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
            Neue Reise planen
          </Link>
          <JoinWithCodeButton />
        </div>

        {/* Trip list */}
        {trips.length === 0 ? (
          <div className="bg-card rounded-2xl card-shadow p-10 text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h2 className="font-bold text-foreground text-[17px] mb-2">Noch keine Reisen</h2>
            <p className="text-sm text-muted-foreground max-w-[220px] mx-auto">
              Plane deine erste gemeinsame Reise oder tritt einer bestehenden bei.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTrips.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">
                  Aktive Reisen
                </h2>
                {activeTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </section>
            )}

            {endedTrips.length > 0 && (
              <CollapsibleEndedTrips trips={endedTrips} />
            )}
          </div>
        )}

      </div>
    </div>
  )
}
