import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TripCard from '@/components/trips/TripCard'
import JoinWithCodeButton from '@/components/trips/JoinWithCodeButton'
import type { Trip } from '@/types/app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch participant rows and profile in parallel
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

      {/* Teal header — breaks out of layout padding */}
      <div className="-mx-4 -mt-7 mb-8 px-6 pt-8 pb-6 rounded-b-3xl" style={{ background: 'linear-gradient(150deg, #1b5c58 0%, #134844 100%)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              TeileniX
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              Hallo, {firstName}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {activeTrips.length > 0
                ? `${activeTrips.length} aktive ${activeTrips.length === 1 ? 'Reise' : 'Reisen'}`
                : 'Noch keine aktiven Reisen'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <JoinWithCodeButton />
            <Link href="/trips/new">
              <Button size="sm" className="gap-1.5 rounded-xl font-semibold text-xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none' }}>
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Neue Reise
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-8">

      {trips.length === 0 ? (
        <div className="bg-card rounded-2xl card-shadow p-10 text-center">
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="font-bold text-foreground text-lg mb-2">Noch keine Reisen</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-[240px] mx-auto">
            Erstelle deine erste Reise oder tritt einer bestehenden Reise bei.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/trips/new">
              <Button className="gap-2 rounded-xl font-semibold shadow-none">
                <Plus className="w-4 h-4" />
                Erste Reise erstellen
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">oder</p>
            <JoinWithCodeButton />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTrips.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">Aktive Reisen</h2>
              {activeTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </section>
          )}
          {endedTrips.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">Abgeschlossene Reisen</h2>
              {endedTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </section>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
