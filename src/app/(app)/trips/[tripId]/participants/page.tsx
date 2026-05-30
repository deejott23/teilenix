import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TripParticipantList from '@/components/trips/TripParticipantList'
import TripCategorySettings from '@/components/trips/TripCategorySettings'
import TripPacklistToggle from '@/components/trips/TripPacklistToggle'
import TripDetailsEdit from '@/components/trips/TripDetailsEdit'
import EndTripButton from '@/components/trips/EndTripButton'
import { ChevronRight, Users, Tag, CreditCard, LogOut, LayoutGrid, Pencil } from 'lucide-react'
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
    .select('id, name, status, created_by, invite_code, enabled_categories, custom_categories, show_packlist, start_date, end_date')
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
  const showPacklist = (trip.show_packlist as boolean | null) ?? false

  const navItems = [
    ...(isCreator ? [{ id: 'reisedaten', icon: <Pencil className="w-4 h-4" />, label: 'Reisedaten' }] : []),
    { id: 'teilnehmer', icon: <Users className="w-4 h-4" />, label: 'Teilnehmer' },
    { id: 'funktionen', icon: <LayoutGrid className="w-4 h-4" />, label: 'Funktionen' },
    { id: 'kategorien', icon: <Tag className="w-4 h-4" />, label: 'Kategorien' },
    { id: 'abrechnung', icon: <CreditCard className="w-4 h-4" />, label: 'Abrechnung', isLink: true },
    ...(isActive && isCreator ? [{ id: 'abschluss', icon: <LogOut className="w-4 h-4" />, label: 'Reise abschließen' }] : []),
  ]

  return (
    <div className="space-y-4">

      {/* Internal navigation */}
      <div className="bg-card card-shadow rounded-2xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Inhalt</p>
        <div className="grid grid-cols-2 gap-1">
          {navItems.map((item, i) => (
            item.isLink ? (
              <Link
                key={item.id}
                href={`/trips/${tripId}/settlement`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground/50 w-4">{i + 1}.</span>
                <span className="text-primary">{item.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
              </Link>
            ) : (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground/50 w-4">{i + 1}.</span>
                {item.label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
              </a>
            )
          ))}
        </div>
      </div>

      {/* Abrechnung shortcut card */}
      <Link
        href={`/trips/${tripId}/settlement`}
        id="abrechnung"
        className="bg-card card-shadow rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors block"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Abrechnung</p>
          <p className="text-xs text-muted-foreground mt-0.5">Salden, Überweisungen & Teilzahlungen</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" strokeWidth={2} />
      </Link>

      {isCreator && (
        <div id="reisedaten">
          <TripDetailsEdit
            tripId={tripId}
            name={trip.name as string}
            startDate={(trip.start_date as string | null) ?? null}
            endDate={(trip.end_date as string | null) ?? null}
          />
        </div>
      )}

      <div id="teilnehmer">
        <TripParticipantList
          tripId={tripId}
          participants={participants}
          inviteCode={(trip.invite_code as string) ?? ''}
          isCreator={isCreator}
          isActive={isActive}
          currentUserId={user.id}
        />
      </div>

      <div id="funktionen">
        <TripPacklistToggle tripId={tripId} showPacklist={showPacklist} />
      </div>

      <div id="kategorien">
        <TripCategorySettings
          tripId={tripId}
          enabledCategories={enabledCategories}
          customCategories={customCategories}
          isActive={isActive}
        />
      </div>

      {isActive && isCreator && (
        <div id="abschluss" className="bg-card card-shadow rounded-2xl p-5">
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
