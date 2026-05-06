'use client'
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/queryKeys'
import dynamic from 'next/dynamic'
import MealZettel from './MealZettel'

const AddMealSheet = dynamic(() => import('./AddMealSheet'), { ssr: false })
import { toast } from 'sonner'
import type { MealIdea, MealSlot, TripParticipant } from '@/types/app'

interface EssenClientProps {
  tripId: string
  participants: TripParticipant[]
  myParticipantId: string
  tripStartDate: string | null
  tripEndDate: string | null
  isActive: boolean
}

async function fetchMeals(tripId: string): Promise<{ ideas: MealIdea[]; slots: MealSlot[] }> {
  const res = await fetch(`/api/trips/${tripId}/meals`)
  if (!res.ok) throw new Error('Failed to fetch meals')
  return res.json()
}

export default function EssenClient({
  tripId,
  myParticipantId,
  isActive,
}: EssenClientProps) {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: queryKeys.meals.byTrip(tripId),
    queryFn: () => fetchMeals(tripId),
  })

  const ideas = data?.ideas ?? []
  const slots = data?.slots ?? []

  const assignedIdeaIds = useMemo(
    () => new Set(slots.filter(s => s.meal_idea_id).map(s => s.meal_idea_id!)),
    [slots]
  )

  const sortByVotes = (list: MealIdea[]) =>
    [...list].sort((a, b) => b.vote_count - a.vote_count)

  const assignedIdeas = useMemo(() => sortByVotes(ideas.filter(i => assignedIdeaIds.has(i.id))), [ideas, assignedIdeaIds])
  const unassignedIdeas = useMemo(() => sortByVotes(ideas.filter(i => !assignedIdeaIds.has(i.id))), [ideas, assignedIdeaIds])

  const handleAdd = async (formData: object) => {
    const res = await fetch(`/api/trips/${tripId}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) throw new Error('Failed to add meal idea')
    toast.success('Idee hinzugefugt!')
    queryClient.invalidateQueries({ queryKey: queryKeys.meals.byTrip(tripId) })
    setShowAddSheet(false)
  }

  const getSlotLabel = (mealId: string): string | undefined => {
    const slot = slots.find(s => s.meal_idea_id === mealId)
    if (!slot) return undefined
    const date = new Date(slot.slot_date + 'T00:00:00')
    const day = date.getDate()
    const month = date.toLocaleDateString('de-DE', { month: 'short' })
    const typeLabel = slot.slot_type === 'lunch' ? 'Mittag' : 'Abend'
    return `${day}. ${month} · ${typeLabel}`
  }

  return (
    <div className="space-y-4 pb-[90px] md:pb-6">
      {/* Cork board */}
      <div className="rounded-[16px] p-3 min-h-[200px]" style={{ background: '#c8b89a' }}>
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-[48px] block mb-3">🍽️</span>
            <p className="text-[15px] font-bold text-amber-900 mb-1">Noch keine Ideen</p>
            <p className="text-[13px] text-amber-800/70">Schlage das erste Essen vor!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedIdeas.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 mb-2 px-1">
                  📌 Bereits eingeplant
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {assignedIdeas.map(meal => (
                    <MealZettel
                      key={meal.id}
                      meal={meal}
                      tripId={tripId}
                      slotLabel={getSlotLabel(meal.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {unassignedIdeas.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 mb-2 px-1">
                  💡 Ideen · abstimmen!
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {unassignedIdeas.map(meal => (
                    <MealZettel
                      key={meal.id}
                      meal={meal}
                      tripId={tripId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isActive && myParticipantId && (
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          className="fixed bottom-[84px] md:bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold text-[14px] shadow-lg hover:bg-amber-600 active:scale-95 transition-all"
        >
          <span className="text-[18px] leading-none">+</span>
          Idee
        </button>
      )}

      {showAddSheet && (
        <AddMealSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
