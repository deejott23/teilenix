'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query/queryKeys'
import MealZettel from './MealZettel'
import AddMealSheet from './AddMealSheet'
import KochplanView from './KochplanView'
import type { MealIdea, MealSlot, TripParticipant } from '@/types/app'

interface EssenClientProps {
  tripId: string
  participants: TripParticipant[]
  myParticipantId: string
  tripStartDate: string | null
  tripEndDate: string | null
  isActive: boolean
}

type Tab = 'ideen' | 'kochplan'

async function fetchMeals(tripId: string): Promise<{ ideas: MealIdea[]; slots: MealSlot[] }> {
  const res = await fetch(`/api/trips/${tripId}/meals`)
  if (!res.ok) throw new Error('Failed to fetch meals')
  return res.json()
}

export default function EssenClient({
  tripId,
  myParticipantId,
  tripStartDate,
  tripEndDate,
  isActive,
}: EssenClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ideen')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: queryKeys.meals.byTrip(tripId),
    queryFn: () => fetchMeals(tripId),
  })

  const ideas = data?.ideas ?? []
  const slots = data?.slots ?? []

  const assignedIdeaIds = new Set(slots.filter(s => s.meal_idea_id).map(s => s.meal_idea_id!))

  const assignedIdeas = ideas.filter(i => assignedIdeaIds.has(i.id))
  const unassignedIdeas = ideas.filter(i => !assignedIdeaIds.has(i.id))

  const handleAdd = async (formData: object) => {
    const res = await fetch(`/api/trips/${tripId}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) throw new Error('Failed to add meal idea')
    toast.success('Idee hinzugefügt!')
    queryClient.invalidateQueries({ queryKey: queryKeys.meals.byTrip(tripId) })
    setShowAddSheet(false)
  }

  const handleVote = async (mealId: string) => {
    // Optimistic update
    const prev = queryClient.getQueryData<{ ideas: MealIdea[]; slots: MealSlot[] }>(queryKeys.meals.byTrip(tripId))
    if (prev) {
      queryClient.setQueryData(queryKeys.meals.byTrip(tripId), {
        ...prev,
        ideas: prev.ideas.map(i => {
          if (i.id !== mealId) return i
          const newMyVote = !i.my_vote
          return {
            ...i,
            my_vote: newMyVote,
            vote_count: newMyVote ? i.vote_count + 1 : i.vote_count - 1,
          }
        }),
      })
    }

    try {
      const res = await fetch(`/api/trips/${tripId}/meals/${mealId}/vote`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { vote_count, my_vote } = await res.json()
      // Sync with server result
      const current = queryClient.getQueryData<{ ideas: MealIdea[]; slots: MealSlot[] }>(queryKeys.meals.byTrip(tripId))
      if (current) {
        queryClient.setQueryData(queryKeys.meals.byTrip(tripId), {
          ...current,
          ideas: current.ideas.map(i => i.id === mealId ? { ...i, vote_count, my_vote } : i),
        })
      }
    } catch {
      // Rollback
      if (prev) queryClient.setQueryData(queryKeys.meals.byTrip(tripId), prev)
      toast.error('Abstimmung fehlgeschlagen')
    }
  }

  const handleDelete = async (mealId: string) => {
    const res = await fetch(`/api/trips/${tripId}/meals/${mealId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Löschen fehlgeschlagen')
      return
    }
    toast.success('Idee gelöscht')
    queryClient.invalidateQueries({ queryKey: queryKeys.meals.byTrip(tripId) })
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meals.byTrip(tripId) })
  }

  const getSlotLabel = (mealId: string): string | undefined => {
    const slot = slots.find(s => s.meal_idea_id === mealId)
    if (!slot) return undefined
    const date = new Date(slot.slot_date + 'T00:00:00')
    const day = date.getDate()
    const month = date.toLocaleDateString('de-DE', { month: 'short' })
    const typeLabel = slot.slot_type === 'lunch' ? 'Mittagessen' : 'Abendessen'
    return `${day}. ${month} · ${typeLabel}`
  }

  return (
    <div className="space-y-4 pb-[90px] md:pb-6">
      {/* Tab switcher */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        {([
          { key: 'ideen', label: '📌 Ideen' },
          { key: 'kochplan', label: '📅 Kochplan' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 py-2 text-center text-[12px] font-bold rounded-[10px] transition-all',
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'ideen' && (
        <>
          {/* Cork board */}
          <div
            className="rounded-[16px] p-3 min-h-[200px]"
            style={{ background: '#c8b89a' }}
          >
            {ideas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-[48px] block mb-3">🍽️</span>
                <p className="text-[15px] font-bold text-amber-900 mb-1">Noch keine Ideen</p>
                <p className="text-[13px] text-amber-800/70">
                  Schlage das erste Essen vor!
                </p>
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
                          myParticipantId={myParticipantId}
                          tripId={tripId}
                          onVote={() => handleVote(meal.id)}
                          onDelete={() => handleDelete(meal.id)}
                          isMyMeal={meal.created_by_participant_id === myParticipantId}
                          isActive={isActive}
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
                          myParticipantId={myParticipantId}
                          tripId={tripId}
                          onVote={() => handleVote(meal.id)}
                          onDelete={() => handleDelete(meal.id)}
                          isMyMeal={meal.created_by_participant_id === myParticipantId}
                          isActive={isActive}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FAB */}
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
        </>
      )}

      {activeTab === 'kochplan' && (
        <KochplanView
          tripId={tripId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          ideas={ideas}
          slots={slots}
          myParticipantId={myParticipantId}
          isActive={isActive}
          onRefresh={handleRefresh}
        />
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
