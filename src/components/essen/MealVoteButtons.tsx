'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { MealVote, MealVoteValue } from '@/types/app'

const VOTE_OPTIONS: { value: MealVoteValue; emoji: string; label: string; activeClass: string }[] = [
  { value: 'yes',   emoji: '😋', label: 'Lecker!',    activeClass: 'bg-green-100 border-green-400 text-green-700' },
  { value: 'maybe', emoji: '🤷', label: 'Egal',        activeClass: 'bg-amber-100 border-amber-400 text-amber-700' },
  { value: 'no',    emoji: '🙅', label: 'Nein',        activeClass: 'bg-red-100 border-red-400 text-red-700' },
]

export default function MealVoteButtons({
  mealId, tripId, participantId, initialVotes, compact = false,
}: {
  mealId: string
  tripId: string
  participantId: string
  initialVotes: MealVote[]
  compact?: boolean
}) {
  const [votes, setVotes] = useState<MealVote[]>(initialVotes)
  const [pending, setPending] = useState(false)

  const myVote = votes.find(v => v.participant_id === participantId)?.vote ?? null
  const countFor = (v: MealVoteValue) => votes.filter(x => x.vote === v).length

  const handleVote = async (v: MealVoteValue) => {
    if (pending) return
    const prev = votes
    setVotes(current => [
      ...current.filter(x => x.participant_id !== participantId),
      ...(myVote === v ? [] : [{
        id: 'optimistic',
        meal_idea_id: mealId,
        participant_id: participantId,
        vote: v,
        created_at: '',
      } as MealVote]),
    ])
    setPending(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/meals/${mealId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: v, participantId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setVotes(data.votes ?? prev)
    } catch {
      setVotes(prev)
      toast.error('Fehler beim Abstimmen')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={cn('flex gap-1.5', compact ? '' : 'w-full')}>
      {VOTE_OPTIONS.map(opt => {
        const isActive = myVote === opt.value
        const count = countFor(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleVote(opt.value)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-[1.5px] text-[12px] font-bold transition-all active:scale-95 flex-1 justify-center',
              isActive
                ? opt.activeClass
                : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span className="text-[14px]">{opt.emoji}</span>
            {compact ? (
              count > 0 && <span>{count}</span>
            ) : (
              <>
                <span>{opt.label}</span>
                {count > 0 && <span className="opacity-60">·{count}</span>}
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
