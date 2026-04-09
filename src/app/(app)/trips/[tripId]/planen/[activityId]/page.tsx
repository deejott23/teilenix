import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, MapPin, Euro, Timer } from 'lucide-react'
import { activityTypeEmoji, activityTypeGradient, activityTypeLabel, formatDepartureTime } from '@/lib/activities'
import { formatCurrency } from '@/lib/formatting'
import ActivityDetailActions from '@/components/activities/ActivityDetailActions'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

function formatActivityDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ tripId: string; activityId: string }>
}) {
  const { tripId, activityId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: activityRaw }, { data: votesRaw }, { data: participantsRaw }, { data: trip }] = await Promise.all([
    db.from('trip_activities').select('*').eq('id', activityId).single(),
    db.from('trip_activity_votes').select('*').eq('activity_id', activityId),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    supabase.from('trips').select('status, created_by').eq('id', tripId).single(),
  ])

  if (!activityRaw) notFound()

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''

  const activity: ActivityWithVotes = {
    ...(activityRaw as Record<string, unknown>),
    votes: votesRaw ?? [],
    creator_name: participantMap.get((activityRaw as Record<string, unknown>).created_by_participant_id as string)?.name ?? 'Unbekannt',
  } as unknown as ActivityWithVotes

  const isActive = trip?.status === 'active'
  const isMyActivity = activity.created_by_participant_id === myParticipantId
  const emoji = activity.cover_emoji ?? activityTypeEmoji[activity.activity_type]
  const gradient = activityTypeGradient[activity.activity_type]
  const yesCount = activity.votes.filter(v => v.vote === 'yes').length
  const maybeCount = activity.votes.filter(v => v.vote === 'maybe').length
  const noCount = activity.votes.filter(v => v.vote === 'no').length
  const totalVotes = activity.votes.length

  const realParticipants = participants.filter(p => !p.is_group && !p.group_id)

  return (
    <div className="space-y-4 pb-6">
      {/* Back */}
      <Link
        href={`/trips/${tripId}/planen`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        Ausflüge
      </Link>

      {/* Hero */}
      <div className={`rounded-[20px] overflow-hidden bg-gradient-to-br ${gradient} aspect-[3/1] flex items-center justify-center relative`}>
        <span className="text-[72px] leading-none drop-shadow-lg">{emoji}</span>
        <div className="absolute top-3 right-3 flex gap-2">
          {activity.status === 'confirmed' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500 text-white">✓ Bestätigt</span>
          )}
          {activity.status === 'idea' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/30 text-white backdrop-blur-sm">💡 Idee</span>
          )}
        </div>
        {activity.activity_date && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/30 text-white backdrop-blur-sm flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatActivityDate(activity.activity_date)}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground leading-tight">{activity.title}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {activityTypeLabel[activity.activity_type]} · Vorschlag von {activity.creator_name}
        </p>
      </div>

      {/* Details card */}
      {(activity.departure_time || activity.meeting_point || activity.duration_label || activity.cost_per_person_cents != null) && (
        <div className="bg-card rounded-[18px] card-shadow divide-y divide-border">
          {activity.departure_time && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-[13px] text-muted-foreground">Abfahrt</span>
              <span className="ml-auto text-[13px] font-semibold">{formatDepartureTime(activity.departure_time)} Uhr</span>
            </div>
          )}
          {activity.meeting_point && (
            <div className="flex items-center gap-3 px-4 py-3">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-[13px] text-muted-foreground">Treffpunkt</span>
              <span className="ml-auto text-[13px] font-semibold text-right max-w-[55%]">{activity.meeting_point}</span>
            </div>
          )}
          {activity.duration_label && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-[13px] text-muted-foreground">Dauer</span>
              <span className="ml-auto text-[13px] font-semibold">{activity.duration_label}</span>
            </div>
          )}
          {activity.cost_per_person_cents != null && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Euro className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-[13px] text-muted-foreground">Kosten ca.</span>
              <span className="ml-auto text-[13px] font-semibold">{formatCurrency(activity.cost_per_person_cents)} / Person</span>
            </div>
          )}
        </div>
      )}

      {/* Voting card */}
      <div className="bg-card rounded-[18px] card-shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-foreground">Abstimmung</h2>
          <div className="flex gap-3 text-[12px] text-muted-foreground">
            <span className="font-semibold text-green-600">{yesCount} dabei</span>
            {maybeCount > 0 && <span>{maybeCount} vielleicht</span>}
            {noCount > 0 && <span>{noCount} nein</span>}
          </div>
        </div>

        {/* Consensus bar */}
        {totalVotes > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
            {yesCount > 0 && <div className="bg-green-400 transition-all" style={{ flex: yesCount }} />}
            {maybeCount > 0 && <div className="bg-amber-400 transition-all" style={{ flex: maybeCount }} />}
            {noCount > 0 && <div className="bg-red-300 transition-all" style={{ flex: noCount }} />}
            {totalVotes < realParticipants.length && (
              <div className="bg-muted flex-1" />
            )}
          </div>
        )}

        {/* Voter avatars */}
        {totalVotes > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {activity.votes.map(vote => {
              const p = participantMap.get(vote.participant_id)
              if (!p) return null
              return (
                <span
                  key={vote.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold"
                >
                  {vote.vote === 'yes' ? '😄' : vote.vote === 'maybe' ? '🤷' : '😴'}
                  {p.name}
                </span>
              )
            })}
          </div>
        )}

        {/* Interactive vote buttons */}
        <ActivityDetailActions
          activityId={activity.id}
          tripId={tripId}
          myParticipantId={myParticipantId}
          initialVotes={activity.votes}
          isActive={isActive}
          isMyActivity={isMyActivity}
          currentStatus={activity.status}
        />
      </div>

      {/* Description */}
      {activity.description && (
        <div className="bg-card rounded-[18px] card-shadow p-4">
          <h2 className="text-[13px] font-bold mb-2">Beschreibung</h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed">{activity.description}</p>
        </div>
      )}

      {/* Expense hint */}
      <Link
        href={`/trips/${tripId}/expenses/new`}
        className="flex items-center gap-3 bg-card rounded-[18px] card-shadow p-4 border border-border active:scale-[0.98] transition-transform"
      >
        <span className="text-[24px]">💸</span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-foreground">Ausgabe erfassen</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Nach dem Ausflug direkt die Kosten eintragen</div>
        </div>
        <span className="text-[14px] font-bold text-primary">→</span>
      </Link>
    </div>
  )
}
