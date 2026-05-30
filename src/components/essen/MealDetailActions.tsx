'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import MealVoteButtons from './MealVoteButtons'
import type { MealVote } from '@/types/app'

const AddMealSheet = dynamic(() => import('./AddMealSheet'), { ssr: false })

export interface MealInitialData {
  emoji: string
  title: string
  description: string | null
  tags: string[]
  link: string | null
}

export default function MealDetailActions({
  mealId, tripId, myParticipantId, initialVotes, isMyMeal, initialData,
}: {
  mealId: string
  tripId: string
  myParticipantId: string
  initialVotes: MealVote[]
  isMyMeal: boolean
  initialData: MealInitialData
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleEdit = async (data: object) => {
    const res = await fetch(`/api/trips/${tripId}/meals/${mealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    toast.success('Gespeichert')
    router.refresh()
  }

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[12px] bg-muted text-foreground font-semibold text-[13px] hover:bg-muted/80 active:scale-[0.98] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[12px] bg-destructive/10 text-destructive font-semibold text-[13px] hover:bg-destructive/20 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            Löschen
          </button>
        </div>
      )}

      {showEdit && (
        <AddMealSheet
          initialValues={initialData}
          onClose={() => setShowEdit(false)}
          onAdd={async (data) => {
            await handleEdit(data)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
