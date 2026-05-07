import Link from 'next/link'
import { MessageCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { activityTypeEmoji, activityTypeGradient, formatDepartureTime } from '@/lib/activities'
import { formatCurrency } from '@/lib/formatting'
import VoteButtons from './VoteButtons'
import type { ActivityWithVotes } from '@/types/app'

function formatActivityDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
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
  const commentCount = activity.comment_count ?? 0

  return (
    <Link href={`/trips/${tripId}/planen/${activity.id}`} className="block">
      <div className={cn(
        'bg-card rounded-[18px] card-shadow border border-border p-3.5',
        isConfirmed && 'border-green-200'
      )}>
        {/* Top row: emoji + content */}
        <div className="flex items-start gap-3">
          {/* Emoji avatar */}
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] flex-shrink-0 bg-gradient-to-br',
            gradient
          )}>
            {emoji}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title + status badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-[14px] leading-tight text-foreground">{activity.title}</h3>
              {isConfirmed ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700 flex-shrink-0 mt-0.5">
                  <Icon name="paid" size={10} />
                  Fest
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0 mt-0.5">
                  💡 Idee
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
              {dateStr && <span className="text-[11px] text-muted-foreground">{dateStr}</span>}
              {activity.departure_time && (
                <span className="text-[11px] text-muted-foreground">🕐 {formatDepartureTime(activity.departure_time)}</span>
              )}
              {activity.cost_per_person_cents != null && (
                <span className="text-[11px] text-muted-foreground">~{formatCurrency(activity.cost_per_person_cents)}/P</span>
              )}
              {activity.meeting_point && (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Icon name="location" size={11} />
                  {activity.meeting_point}
                </span>
              )}
              {!dateStr && !activity.departure_time && !activity.cost_per_person_cents && !activity.meeting_point && (
                <span className="text-[11px] text-muted-foreground">von {activity.creator_name}</span>
              )}
            </div>

            {/* Link preview */}
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary font-semibold"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                {extractHostname(activity.link)}
              </a>
            )}

            {/* Description snippet */}
            {activity.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{activity.description}</p>
            )}
          </div>
        </div>

        {/* Bottom row: votes + comment indicator */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border">
          <div className="flex-1" onClick={e => e.preventDefault()}>
            {isConfirmed ? (
              totalVotes > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.round((yesCount / totalVotes) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-green-700 flex-shrink-0">{yesCount}/{totalVotes} dabei</span>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">Noch keine Stimmen</span>
              )
            ) : (
              <VoteButtons
                activityId={activity.id}
                tripId={tripId}
                participantId={myParticipantId}
                initialVotes={activity.votes}
                compact
              />
            )}
          </div>

          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
              <MessageCircle className="w-3.5 h-3.5" />
              {commentCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
