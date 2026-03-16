import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripParticipantList from '@/components/trips/TripParticipantList'
import TripCategorySettings from '@/components/trips/TripCategorySettings'
import EndTripButton from '@/components/trips/EndTripButton'
import type { TripParticipant } from '@/types/app'

const ALL_CATEGORY_KEYS = ['food','transport','accommodation','activities','shopping','health','other']

export default async function TripSettingsPage({
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
    .select('id, name, status, created_by, invite_code, enabled_categories, custom_categories')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) redirect('/dashboard')

  const { data: participantsRaw } = await supabase
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const isCreator = trip.created_by === user.id
  const isActive = trip.status === 'active'
  const enabledCategories = (trip.enabled_categories as string[] | null) ?? ALL_CATEGORY_KEYS
  const customCategories = (trip.custom_categories as string[] | null) ?? []

  return (
    <div className="space-y-5">
      <TripParticipantList
        tripId={tripId}
        participants={participants}
        inviteCode={(trip.invite_code as string) ?? ''}
        isCreator={isCreator}
        isActive={isActive}
        currentUserId={user.id}
      />
      <TripCategorySettings
        tripId={tripId}
        enabledCategories={enabledCategories}
        customCategories={customCategories}
        isActive={isActive}
      />

      {isActive && isCreator && (
        <div className="bg-card card-shadow rounded-2xl p-5">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Reise abschließen</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Beendet die Reise und erstellt die finale Abrechnung. Danach können keine Ausgaben mehr hinzugefügt werden.
          </p>
          <EndTripButton tripId={tripId} />
        </div>
      )}
    </div>
  )
}
