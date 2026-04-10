'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import SlotPickerSheet from './SlotPickerSheet'
import type { MealIdea, MealSlot } from '@/types/app'

interface KochplanViewProps {
  tripId: string
  tripStartDate: string | null
  tripEndDate: string | null
  ideas: MealIdea[]
  slots: MealSlot[]
  myParticipantId: string
  isActive: boolean
  onRefresh: () => void
}

function generateDateRange(start: string | null, end: string | null): Date[] {
  if (!start || !end) return []
  const dates: Date[] = []
  const current = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (current <= last) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })
}

interface ActiveSlot {
  date: string
  type: 'lunch' | 'dinner'
}

export default function KochplanView({
  tripId,
  tripStartDate,
  tripEndDate,
  ideas,
  slots,
  isActive,
  onRefresh,
}: KochplanViewProps) {
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)

  const dates = generateDateRange(tripStartDate, tripEndDate)

  const getSlot = (date: string, type: 'lunch' | 'dinner'): MealSlot | undefined => {
    return slots.find(s => s.slot_date === date && s.slot_type === type)
  }

  const getIdea = (slot: MealSlot | undefined): MealIdea | undefined => {
    if (!slot || !slot.meal_idea_id) return undefined
    return ideas.find(i => i.id === slot.meal_idea_id)
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-[48px] block mb-3">📅</span>
        <p className="text-[15px] font-bold text-foreground mb-1">Kein Reisezeitraum</p>
        <p className="text-[13px] text-muted-foreground">
          Bitte lege Start- und Enddatum der Reise fest.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {dates.map(date => {
          const iso = toISODate(date)
          const lunchSlot = getSlot(iso, 'lunch')
          const dinnerSlot = getSlot(iso, 'dinner')
          const lunchIdea = getIdea(lunchSlot)
          const dinnerIdea = getIdea(dinnerSlot)

          return (
            <div key={iso} className="bg-card rounded-[16px] card-shadow overflow-hidden">
              {/* Day header */}
              <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[13px] font-bold text-foreground">{formatDayHeader(date)}</p>
              </div>

              <div className="divide-y divide-border">
                {/* Lunch slot */}
                <SlotRow
                  label="☀️ Mittagessen"
                  idea={lunchIdea}
                  isActive={isActive}
                  onClick={() => setActiveSlot({ date: iso, type: 'lunch' })}
                  onClear={async () => {
                    await fetch(`/api/trips/${tripId}/meals/slots`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ slot_date: iso, slot_type: 'lunch', meal_idea_id: null }),
                    })
                    onRefresh()
                  }}
                />
                {/* Dinner slot */}
                <SlotRow
                  label="🌙 Abendessen"
                  idea={dinnerIdea}
                  isActive={isActive}
                  onClick={() => setActiveSlot({ date: iso, type: 'dinner' })}
                  onClear={async () => {
                    await fetch(`/api/trips/${tripId}/meals/slots`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ slot_date: iso, slot_type: 'dinner', meal_idea_id: null }),
                    })
                    onRefresh()
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {activeSlot && (
        <SlotPickerSheet
          tripId={tripId}
          slotDate={activeSlot.date}
          slotType={activeSlot.type}
          ideas={ideas}
          currentMealId={getSlot(activeSlot.date, activeSlot.type)?.meal_idea_id ?? null}
          onClose={() => setActiveSlot(null)}
          onRefresh={onRefresh}
        />
      )}
    </>
  )
}

interface SlotRowProps {
  label: string
  idea: MealIdea | undefined
  isActive: boolean
  onClick: () => void
  onClear: () => Promise<void>
}

function SlotRow({ label, idea, isActive, onClick, onClear }: SlotRowProps) {
  return (
    <div className="flex items-center px-4 py-3 gap-3">
      <span className="text-[12px] font-bold text-muted-foreground w-28 flex-shrink-0">{label}</span>
      {idea ? (
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          <span className="text-[18px]">{idea.emoji}</span>
          <span className="text-[13px] font-semibold text-foreground truncate">{idea.title}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={isActive ? onClick : undefined}
          className={cn(
            'flex-1 text-left text-[12px] transition-colors',
            isActive
              ? 'text-muted-foreground hover:text-foreground cursor-pointer'
              : 'text-muted-foreground/40 cursor-default'
          )}
        >
          {isActive ? '+ Leer · tippen zum Belegen' : '—'}
        </button>
      )}
      {idea && isActive && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onClear() }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors text-[12px] flex-shrink-0"
          aria-label="Entfernen"
        >
          ×
        </button>
      )}
    </div>
  )
}
