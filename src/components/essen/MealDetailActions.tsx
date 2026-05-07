'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import MealVoteButtons from './MealVoteButtons'
import type { MealVote } from '@/types/app'

export default function MealDetailActions({
  mealId, tripId, myParticipantId, initialVotes, isMyMeal,
}: {
  mealId: string
  tripId: string
  myParticipantId: string
  initialVotes: MealVote[]
  isMyMeal: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Essensidee wirklich löschen?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/meals/${mealId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Gelöscht')
      router.push(`/trips/${tripId}/essen`)
    } catch {
      toast.error('Fehler beim Löschen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {myParticipantId && (
        <MealVoteButtons
          mealId={mealId}
          tripId={tripId}
          participantId={myParticipantId}
          initialVotes={initialVotes}
        />
      )}

      {isMyMeal && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-[12px] bg-destructive/10 text-destructive font-semibold text-[13px] hover:bg-destructive/20 active:scale-[0.98] transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          Essensidee löschen
        </button>
      )}
    </div>
  )
}
