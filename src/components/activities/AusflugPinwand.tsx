'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityWithVotes } from '@/types/app'

// ── Visual helpers ────────────────────────────────────────────────────────────
const COLORS = ['#fff9c4', '#fce4ec', '#dcedc8', '#e3f2fd', '#ffe0b2', '#ede7f6']
const ROTATIONS = ['-rotate-2', '-rotate-1', 'rotate-0', 'rotate-1', 'rotate-2']

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Single activity card ──────────────────────────────────────────────────────
function AusflugZettel({ activity, tripId }: { activity: ActivityWithVotes; tripId: string }) {
  const emoji = activity.cover_emoji ?? activityTypeEmoji[activity.activity_type]
  const isConfirmed = activity.status === 'confirmed'
  const bgColor = COLORS[hashId(activity.created_by_participant_id) % COLORS.length]
  const rotation = ROTATIONS[hashId(activity.id) % ROTATIONS.length]
  const yesCount = activity.votes.filter(v => v.vote === 'yes').length
  const maybeCount = activity.votes.filter(v => v.vote === 'maybe').length
  const noCount = activity.votes.filter(v => v.vote === 'no').length

  return (
    <Link href={`/trips/${tripId}/planen/${activity.id}`}>
      <div
        className={cn(
          'relative rounded-[4px] p-3 flex flex-col gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]',
          rotation
        )}
        style={{ background: bgColor, boxShadow: '2px 3px 8px rgba(0,0,0,0.18)' }}
      >
        {/* Status badge */}
        {isConfirmed && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-green-500 text-white rounded px-1.5 py-0.5 leading-none">
            ✓ Fest
          </span>
        )}

        {/* Emoji */}
        <span className="text-[24px] leading-tight">{emoji}</span>

        {/* Title */}
        <p className="font-bold text-[13px] text-gray-800 leading-snug break-words line-clamp-2">
          {activity.title}
        </p>

        {/* Date chip */}
        {activity.activity_date && (
          <span className="text-[10px] text-gray-500 font-semibold">
            📅 {formatShortDate(activity.activity_date)}
          </span>
        )}

        {/* Footer: creator + vote counts */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] text-gray-500 truncate max-w-[50%]">
            {activity.creator_name}
          </span>
          <div className="flex items-center gap-1">
            <span className={cn(
              'text-[10px] font-bold px-1 py-0.5 rounded',
              yesCount > 0 ? 'text-green-700' : 'text-gray-300'
            )}>
              😄{yesCount}
            </span>
            <span className={cn(
              'text-[10px] font-bold px-1 py-0.5 rounded',
              maybeCount > 0 ? 'text-amber-600' : 'text-gray-300'
            )}>
              🤷{maybeCount}
            </span>
            <span className={cn(
              'text-[10px] font-bold px-1 py-0.5 rounded',
              noCount > 0 ? 'text-red-500' : 'text-gray-300'
            )}>
              😴{noCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main pinboard component ───────────────────────────────────────────────────
interface AusflugPinwandProps {
  activities: ActivityWithVotes[]
  tripId: string
}

function sortByYesVotes(list: ActivityWithVotes[]): ActivityWithVotes[] {
  return [...list].sort((a, b) => {
    const aYes = a.votes.filter(v => v.vote === 'yes').length
    const bYes = b.votes.filter(v => v.vote === 'yes').length
    return bYes - aYes
  })
}

export default function AusflugPinwand({ activities, tripId }: AusflugPinwandProps) {
  const confirmed = sortByYesVotes(activities.filter(a => a.status === 'confirmed'))
  const ideas = sortByYesVotes(activities.filter(a => a.status === 'idea'))

  return (
    <div className="rounded-[16px] p-3 min-h-[200px]" style={{ background: '#c8b89a' }}>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-[48px] block mb-3">🗺️</span>
          <p className="text-[15px] font-bold text-amber-900 mb-1">Noch keine Ausfluege</p>
          <p className="text-[13px] text-amber-800/70">Schlage den ersten Ausflug vor!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {confirmed.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 mb-2 px-1">
                📌 Bestatigt
              </p>
              <div className="grid grid-cols-2 gap-3">
                {confirmed.map(a => <AusflugZettel key={a.id} activity={a} tripId={tripId} />)}
              </div>
            </div>
          )}
          {ideas.length > 0 && (
            <div className={confirmed.length > 0 ? 'mt-4' : ''}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 mb-2 px-1">
                💡 Ideen · abstimmen!
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ideas.map(a => <AusflugZettel key={a.id} activity={a} tripId={tripId} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
