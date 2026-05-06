'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { MealIdea } from '@/types/app'

const COLORS = ['#fff9c4', '#fce4ec', '#dcedc8', '#e3f2fd', '#ffe0b2', '#ede7f6']
const ROTATIONS = ['-rotate-2', '-rotate-1', 'rotate-0', 'rotate-1', 'rotate-2']

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6']

interface MealZettelProps {
  meal: MealIdea
  tripId: string
  slotLabel?: string
}

export default function MealZettel({ meal, tripId, slotLabel }: MealZettelProps) {
  const colorIdx = hashString(meal.created_by_participant_id) % COLORS.length
  const rotIdx = hashString(meal.id) % ROTATIONS.length
  const avatarColor = AVATAR_COLORS[hashString(meal.created_by_participant_id) % AVATAR_COLORS.length]

  const bgColor = COLORS[colorIdx]
  const rotation = ROTATIONS[rotIdx]

  return (
    <Link href={`/trips/${tripId}/essen/${meal.id}`}>
      <div
        className={cn(
          'relative rounded-[4px] p-3 flex flex-col gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]',
          rotation
        )}
        style={{ background: bgColor, boxShadow: '2px 3px 8px rgba(0,0,0,0.18)' }}
      >
        {/* Pushpin if assigned */}
        {slotLabel && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[18px] leading-none z-10" aria-hidden>
            📌
          </span>
        )}

        {/* Day badge */}
        {slotLabel && (
          <span className="absolute top-1 right-1 text-[9px] font-bold bg-amber-500 text-white rounded px-1 py-0.5 leading-none">
            {slotLabel}
          </span>
        )}

        {/* Emoji */}
        <span className="text-2xl leading-tight">{meal.emoji}</span>

        {/* Title */}
        <p className="font-bold text-[13px] text-gray-800 leading-snug break-words line-clamp-2">
          {meal.title}
        </p>

        {/* Description */}
        {meal.description && (
          <p className="text-[11px] text-gray-600 line-clamp-2 leading-snug">
            {meal.description}
          </p>
        )}

        {/* Tags */}
        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meal.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-black/8 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: avatar + vote summary */}
        <div className="flex items-center justify-between mt-1">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: avatarColor }}
            title={meal.creator_name}
          >
            {getInitials(meal.creator_name)}
          </span>

          {/* Compact vote indicator */}
          {meal.vote_count > 0 ? (
            <span className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
              meal.my_vote_value === 'yes' ? 'bg-green-200 text-green-800' : 'bg-black/10 text-gray-600'
            )}>
              😋 {meal.vote_count}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 italic">abstimmen →</span>
          )}
        </div>
      </div>
    </Link>
  )
}
