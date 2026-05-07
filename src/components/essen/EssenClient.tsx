'use client'
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
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

function SectionHeader({
  label, count, open, onToggle,
}: {
  label: string; count: number; open: boolean; onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 mb-2"
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

export default function EssenClient({
  tripId,
  myParticipantId,
  isActive,
}: EssenClientProps) {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showAssigned, setShowAssigned] = useState(true)
  const [showIdeas, setShowIdeas] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: queryKeys.meals.byTrip(tripId),
    queryFn: () => fetchMeals(tripId),
  })

  const ideas = data?.ideas ?? []
  const slots = data?.slots ?? []

  const today = new Date().toISOString().slice(0, 10)

  // Categorize by slot assignment + date
  const { pastIds, futureAssignedIds } = useMemo(() => {
    const past = new Set<string>()
    const future = new Set<string>()
    for (const s of slots) {
      if (!s.meal_idea_id) continue
      if (s.slot_date < today) past.add(s.meal_idea_id)
      else future.add(s.meal_idea_id)
    }
    return { pastIds: past, futureAssignedIds: future }
  }, [slots, today])

  const sortByVotes = (list: MealIdea[]) =>
    [...list].sort((a, b) => b.vote_count - a.vote_count)

  const assignedIdeas = useMemo(() => sortByVotes(ideas.filter(i => futureAssignedIds.has(i.id))), [ideas, futureAssignedIds])
  const unassignedIdeas = useMemo(() => sortByVotes(ideas.filter(i => !futureAssignedIds.has(i.id) && !pastIds.has(i.id))), [ideas, futureAssignedIds, pastIds])
  const pastIdeas = useMemo(() => sortByVotes(ideas.filter(i => pastIds.has(i.id))), [ideas, pastIds])

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
            {/* Assigned to future date */}
            {assignedIdeas.length > 0 && (
              <div>
                <SectionHeader
                  label="📌 Bereits eingeplant"
                  count={assignedIdeas.length}
                  open={showAssigned}
                  onToggle={() => setShowAssigned(v => !v)}
                />
                {showAssigned && (
                  <div className="grid grid-cols-2 gap-3">
                    {assignedIdeas.map(meal => (
                      <MealZettel key={meal.id} meal={meal} tripId={tripId} slotLabel={getSlotLabel(meal.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unassigned ideas */}
            {unassignedIdeas.length > 0 && (
              <div>
                <SectionHeader
                  label="💡 Ideen · abstimmen!"
                  count={unassignedIdeas.length}
                  open={showIdeas}
                  onToggle={() => setShowIdeas(v => !v)}
                />
                {showIdeas && (
                  <div className="grid grid-cols-2 gap-3">
                    {unassignedIdeas.map(meal => (
                      <MealZettel key={meal.id} meal={meal} tripId={tripId} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Past meals */}
            {pastIdeas.length > 0 && (
              <div>
                <SectionHeader
                  label="✅ Gemacht"
                  count={pastIdeas.length}
                  open={showPast}
                  onToggle={() => setShowPast(v => !v)}
                />
                {showPast && (
                  <div className="grid grid-cols-2 gap-3 opacity-70">
                    {pastIdeas.map(meal => (
                      <MealZettel key={meal.id} meal={meal} tripId={tripId} slotLabel={getSlotLabel(meal.id)} />
                    ))}
                  </div>
                )}
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
          Essen vorschlagen
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
