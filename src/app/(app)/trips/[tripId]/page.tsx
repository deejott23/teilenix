import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/user'
import { getTrip } from '@/lib/supabase/trips'
import { Suspense } from 'react'
import RealtimeQueryRefresher from '@/components/realtime/RealtimeQueryRefresher'
import RealtimePageRefresher from '@/components/realtime/RealtimePageRefresher'
import BalanceCard, { BalanceCardSkeleton } from '@/components/trips/overview/BalanceCard'
import ActivitiesCard, { ActivitiesCardSkeleton } from '@/components/trips/overview/ActivitiesCard'
import PacklistShoppingCards, { PacklistShoppingCardsSkeleton } from '@/components/trips/overview/PacklistShoppingCards'
import ActivityStream, { ActivityStreamSkeleton } from '@/components/trips/overview/ActivityStream'
import EssenCard, { EssenCardSkeleton } from '@/components/trips/overview/EssenCard'
import HeuteCard, { HeuteCardSkeleton } from '@/components/trips/overview/HeuteCard'
import FactsCard, { FactsCardSkeleton } from '@/components/trips/overview/FactsCard'

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params

  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // Trip + participant in parallel; trip is cached with layout via React cache()
  const [trip, { data: meRaw }] = await Promise.all([
    getTrip(tripId),
    supabase.from('trip_participants').select('id').eq('trip_id', tripId).eq('user_id', user.id).maybeSingle(),
  ])

  if (!trip) notFound()

  const myParticipantId = meRaw?.id ?? ''

  const showFacts = false

  return (
    <div className="space-y-3">
      <RealtimeQueryRefresher tripId={tripId} tables={['expenses', 'packlist_items', 'activities', 'shopping_items']} />
      <RealtimePageRefresher tripId={tripId} tables={['trip_meal_ideas', 'trip_meal_slots']} />

      {/* Heute Card — zeigt heutige Mahlzeiten und Ausflüge */}
      <Suspense fallback={<HeuteCardSkeleton />}>
        <HeuteCard tripId={tripId} />
      </Suspense>

      {/* Balance Card — streamt nach den Expense-Queries */}
      <Suspense fallback={<BalanceCardSkeleton />}>
        <BalanceCard tripId={tripId} myParticipantId={myParticipantId} />
      </Suspense>

      {/* Packliste + Einkauf — direkt unter der Ausgabenübersicht */}
      <Suspense fallback={<PacklistShoppingCardsSkeleton />}>
        <PacklistShoppingCards tripId={tripId} myParticipantId={myParticipantId} />
      </Suspense>

      {/* Ausflüge Card — streamt nach Activities-Query */}
      <Suspense fallback={<ActivitiesCardSkeleton />}>
        <ActivitiesCard tripId={tripId} />
      </Suspense>

      {/* Essen Card — streamt nach Meal-Queries */}
      <Suspense fallback={<EssenCardSkeleton />}>
        <EssenCard tripId={tripId} />
      </Suspense>

      {/* ReiseBlatt Facts Card — erst ab Tag 3 einer aktiven Reise */}
      {showFacts && (
        <Suspense fallback={<FactsCardSkeleton />}>
          <FactsCard tripId={tripId} />
        </Suspense>
      )}

      {/* Aktivitäts-Stream — streamt zuletzt */}
      <Suspense fallback={<ActivityStreamSkeleton />}>
        <ActivityStream tripId={tripId} />
      </Suspense>
    </div>
  )
}
