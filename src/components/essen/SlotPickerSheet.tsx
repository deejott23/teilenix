'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealIdea } from '@/types/app'

interface SlotPickerSheetProps {
  tripId: string
  slotDate: string
  slotType: 'lunch' | 'dinner'
  ideas: MealIdea[]
  currentMealId: string | null
  onClose: () => void
  onRefresh: () => void
}

const SLOT_TYPE_LABEL: Record<string, string> = {
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function SlotPickerSheet({
  tripId,
  slotDate,
  slotType,
  ideas,
  currentMealId,
  onClose,
  onRefresh,
}: SlotPickerSheetProps) {
  const [loading, setLoading] = useState(false)

  const assign = async (mealIdeaId: string | null) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/meals/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_date: slotDate, slot_type: slotType, meal_idea_id: mealIdeaId }),
      })
      if (!res.ok) throw new Error()
      onRefresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">{SLOT_TYPE_LABEL[slotType]}</h2>
            <p className="text-[12px] text-muted-foreground">{formatDate(slotDate)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 pb-10 space-y-1">
          {/* Clear option */}
          <button
            type="button"
            onClick={() => assign(null)}
            disabled={loading}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors',
              currentMealId === null
                ? 'bg-muted/80 text-muted-foreground'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <span className="text-[20px]">🚫</span>
            <span className="text-[14px] font-semibold">Leer lassen / Entfernen</span>
            {currentMealId === null && (
              <span className="ml-auto text-[11px] font-bold text-muted-foreground/60">Aktuell</span>
            )}
          </button>

          <div className="border-t border-border my-2" />

          {ideas.length === 0 ? (
            <p className="text-center py-6 text-[13px] text-muted-foreground">
              Keine Ideen vorhanden. Füge zuerst Ideen hinzu!
            </p>
          ) : (
            ideas.map(idea => (
              <button
                key={idea.id}
                type="button"
                onClick={() => assign(idea.id)}
                disabled={loading}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors',
                  idea.id === currentMealId
                    ? 'bg-amber-50 border border-amber-200'
                    : 'hover:bg-muted'
                )}
              >
                <span className="text-[20px] flex-shrink-0">{idea.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">{idea.title}</p>
                  {idea.tags.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">{idea.tags.join(' · ')}</p>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[12px] text-muted-foreground flex-shrink-0">
                  <span>🔥</span>
                  <span>{idea.vote_count}</span>
                </span>
                {idea.id === currentMealId && (
                  <span className="text-[11px] font-bold text-amber-600">Aktuell</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
