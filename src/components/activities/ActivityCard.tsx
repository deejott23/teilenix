import Link from 'next/link'
import { Calendar, Clock, MapPin, Euro, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activityTypeEmoji, activityTypeGradient, formatDepartureTime } from '@/lib/activities'
import { formatCurrency } from '@/lib/formatting'
import VoteButtons from './VoteButtons'
import type { ActivityWithVotes } from '@/types/app'

function formatActivityDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ActivityCard({
  activity, myParticipantId, tripId,
}: {
  activity: ActivityWithVotes
  myParticipantId: string
  tripId: string
}) {
  const emoji = activity.cover_emoji ?? activityTypeEmoji[activity.activity_type]
  const gradient = activityTypeGradient[activity.activity_type]
  const isConfirmed = activity.status === 'confirmed'
  const yesCount = activity.votes.filter(v => v.vote === 'yes').length
  const totalVotes = activity.votes.length
  const dateStr = formatActivityDate(activity.activity_date)

  return (
    <Link href={`/trips/${tripId}/planen/${activity.id}`} className="block">
      <div className={cn(
        'bg-card rounded-[18px] overflow-hidden card-shadow border border-border',
        isConfirmed && 'border-green-200'
      )}>
        {/* Image area */}
        <div className={cn(
          'relative h-[110px] flex items-end p-3 overflow-hidden bg-gradient-to-br',
          gradient
        )}>
          {/* Big emoji watermark */}
          <span className="absolute right-3 bottom-2 text-[40px] leading-none opacity-40 select-none pointer-events-none">
            {emoji}
          </span>
          {/* Status badge */}
          {isConfirmed ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">
              <Check className="w-3 h-3" strokeWidth={3} />
              Bestätigt{dateStr ? ` · ${dateStr}` : ''}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/25 text-white border border-white/30">
              💡 Idee{dateStr ? ` · ${dateStr}` : ' · kein Datum'}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className={cn('p-3.5', isConfirmed && 'border-t-[3px] border-green-400')}>
          <h3 className="font-bold text-[15px] text-foreground leading-tight mb-1">{activity.title}</h3>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-3">
            {activity.departure_time && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDepartureTime(activity.departure_time)} Uhr
              </span>
            )}
            {activity.duration_label && (
              <span className="text-[11px] text-muted-foreground">⏱ {activity.duration_label}</span>
            )}
            {activity.cost_per_person_cents != null && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Euro className="w-3 h-3" />
                ~{formatCurrency(activity.cost_per_person_cents)}/P
              </span>
            )}
            {activity.meeting_point && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {activity.meeting_point}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">von {activity.creator_name}</span>
          </div>

          {/* Vote bar (confirmed) or Vote buttons (idea) */}
          {isConfirmed ? (
            totalVotes > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.round((yesCount / totalVotes) * 100)}%` }}
                    />
                  </div>
                  <span className="ml-2 text-[11px] font-bold text-green-700">{yesCount}/{totalVotes} dabei</span>
                </div>
              </div>
            )
          ) : (
            <div onClick={e => e.preventDefault()}>
              <VoteButtons
                activityId={activity.id}
                tripId={tripId}
                participantId={myParticipantId}
                initialVotes={activity.votes}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
