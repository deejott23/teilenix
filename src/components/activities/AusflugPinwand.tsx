'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityWithVotes } from '@/types/app'

// ── Visual helpers ────────────────────────────────────────────────────────────
const COLORS = ['#fff9c4', '#fce4ec', '#dcedc8', '#e3f2fd', '#ffe0b2', '#ede7f6']
const ROTATIONS = ['-rotate-2', '-rotate-1', 'rotate-0', 'rotate-1', 'rotate-2']
const AVATAR_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6']

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Single activity card ──────────────────────────────────────────────────────
function AusflugZettel({ activity, tripId }: { activity: ActivityWithVotes; tripId: string }) {
  const emoji = activity.cover_emoji ?? activityTypeEmoji[activity.activity_type]
  const isEingeplant = !!activity.activity_date || activity.status === 'confirmed'
  const bgColor = COLORS[hashId(activity.created_by_participant_id) % COLORS.length]
  const rotation = ROTATIONS[hashId(activity.id) % ROTATIONS.length]
  const avatarColor = AVATAR_COLORS[hashId(activity.created_by_participant_id) % AVATAR_COLORS.length]
  const yesCount = activity.votes.filter(v => v.vote === 'yes').length
  const maybeCount = activity.votes.filter(v => v.vote === 'maybe').length
  const noCount = activity.votes.filter(v => v.vote === 'no').length
  const hasVotes = yesCount > 0 || maybeCount > 0 || noCount > 0

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
        {isEingeplant && !activity.activity_date && (
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

        {/* Footer: avatar + vote counts */}
        <div className="flex items-center justify-between mt-0.5">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: avatarColor }}
            title={activity.creator_name}
          >
            {getInitials(activity.creator_name)}
          </span>
          {hasVotes ? (
            <div className="flex items-center gap-1">
              <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded', yesCount > 0 ? 'text-green-700' : 'text-gray-300')}>
                😄{yesCount}
              </span>
              <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded', maybeCount > 0 ? 'text-amber-600' : 'text-gray-300')}>
                🤷{maybeCount}
              </span>
              <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded', noCount > 0 ? 'text-red-500' : 'text-gray-300')}>
                😴{noCount}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">abstimmen →</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Collapsible section header ────────────────────────────────────────────────
function SectionHeader({
  label, count, open, onToggle,
}: {
  label: string; count: number; open: boolean; onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 mb-2 group"
    >
      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70">
        {label} <span className="text-amber-900/40">({count})</span>
      </span>
      {open
        ? <ChevronUp className="w-3.5 h-3.5 text-amber-900/40" strokeWidth={2.5} />
        : <ChevronDown className="w-3.5 h-3.5 text-amber-900/40" strokeWidth={2.5} />}
    </button>
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
  const today = new Date().toISOString().slice(0, 10)

  const past = sortByYesVotes(
    activities.filter(a => a.activity_date && a.activity_date < today)
  )
  const active = activities.filter(a => !a.activity_date || a.activity_date >= today)
  // "Eingeplant" = has a date (future) OR explicitly confirmed
  const confirmed = sortByYesVotes(active.filter(a => !!a.activity_date || a.status === 'confirmed'))
  const ideas = sortByYesVotes(active.filter(a => !a.activity_date && a.status !== 'confirmed'))

  const [showConfirmed, setShowConfirmed] = useState(true)
  const [showIdeas, setShowIdeas] = useState(true)
  const [showPast, setShowPast] = useState(false)

  return (
    <div className="rounded-[16px] p-3 min-h-[200px]" style={{ background: '#c8b89a' }}>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-[48px] block mb-3">🗺️</span>
          <p className="text-[15px] font-bold text-amber-900 mb-1">Noch keine Ausflüge</p>
          <p className="text-[13px] text-amber-800/70">Schlage den ersten Ausflug vor!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Confirmed */}
          {confirmed.length > 0 && (
            <div>
              <SectionHeader
                label="📌 Eingeplant"
                count={confirmed.length}
                open={showConfirmed}
                onToggle={() => setShowConfirmed(v => !v)}
              />
              {showConfirmed && (
                <div className="grid grid-cols-2 gap-3">
                  {confirmed.map(a => <AusflugZettel key={a.id} activity={a} tripId={tripId} />)}
                </div>
              )}
            </div>
          )}

          {/* Ideas */}
          {ideas.length > 0 && (
            <div>
              <SectionHeader
                label="💡 Ideen · abstimmen!"
                count={ideas.length}
                open={showIdeas}
                onToggle={() => setShowIdeas(v => !v)}
              />
              {showIdeas && (
                <div className="grid grid-cols-2 gap-3">
                  {ideas.map(a => <AusflugZettel key={a.id} activity={a} tripId={tripId} />)}
                </div>
              )}
            </div>
          )}

          {/* Past / Gemacht */}
          {past.length > 0 && (
            <div>
              <SectionHeader
                label="✅ Gemacht"
                count={past.length}
                open={showPast}
                onToggle={() => setShowPast(v => !v)}
              />
              {showPast && (
                <div className="grid grid-cols-2 gap-3 opacity-70">
                  {past.map(a => <AusflugZettel key={a.id} activity={a} tripId={tripId} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
