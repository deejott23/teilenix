'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

function generateDates(start: string | null, end: string | null): Date[] {
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface CurrentSlot {
  slot_date: string
  slot_type: 'lunch' | 'dinner'
}

interface MealSlotAssignerProps {
  tripId: string
  mealId: string
  currentSlot: CurrentSlot | null
  tripStartDate: string | null
  tripEndDate: string | null
}

const SLOT_LABELS: Record<string, string> = { lunch: 'Mittagessen', dinner: 'Abendessen' }

export default function MealSlotAssigner({
  tripId,
  mealId,
  currentSlot,
  tripStartDate,
  tripEndDate,
}: MealSlotAssignerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dates = generateDates(tripStartDate, tripEndDate)

  const assign = async (slotDate: string | null, slotType: 'lunch' | 'dinner' | null) => {
    setLoading(true)
    try {
      if (slotDate && slotType) {
        await fetch(`/api/trips/${tripId}/meals/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot_date: slotDate, slot_type: slotType, meal_idea_id: mealId }),
        })
      } else if (currentSlot) {
        // remove: clear the current slot
        await fetch(`/api/trips/${tripId}/meals/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot_date: currentSlot.slot_date, slot_type: currentSlot.slot_type, meal_idea_id: null }),
        })
      }
      router.refresh()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const currentFormatted = currentSlot
    ? `${new Date(currentSlot.slot_date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })} · ${SLOT_LABELS[currentSlot.slot_type]}`
    : null

  return (
    <>
      <div className="bg-card rounded-[18px] card-shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-foreground">Einplanen</h2>
          {currentSlot && (
            <button
              type="button"
              onClick={() => assign(null, null)}
              disabled={loading}
              className="text-[11px] text-muted-foreground hover:text-destructive font-semibold transition-colors"
            >
              Entfernen
            </button>
          )}
        </div>

        {currentSlot ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
            </div>
            <p className="flex-1 text-[13px] font-semibold text-foreground">{currentFormatted}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[12px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              Ändern
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!dates.length}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[13px] font-semibold border-2 border-dashed transition-colors',
              dates.length
                ? 'border-amber-300/60 text-amber-600/70 hover:border-amber-400 hover:text-amber-600'
                : 'border-muted-foreground/20 text-muted-foreground/40 cursor-default'
            )}
          >
            <CalendarDays className="w-4 h-4" strokeWidth={1.5} />
            {dates.length ? 'Tag + Mahlzeit wählen' : 'Kein Reisezeitraum gesetzt'}
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-[15px] font-bold text-foreground">Mahlzeit einplanen</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="px-5 pb-10 space-y-2">
              {currentSlot && (
                <>
                  <button
                    type="button"
                    onClick={() => assign(null, null)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-muted transition-colors"
                  >
                    <span className="text-[20px]">🚫</span>
                    <span className="text-[14px] font-semibold text-muted-foreground">Eintrag entfernen</span>
                  </button>
                  <div className="border-t border-border" />
                </>
              )}

              {dates.map(date => {
                const iso = toISODate(date)
                const dayLabel = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
                const isCurrentDate = currentSlot?.slot_date === iso

                return (
                  <div key={iso}>
                    <p className={cn(
                      'text-[11px] font-bold uppercase tracking-wider px-1 mb-1.5',
                      isCurrentDate ? 'text-amber-600' : 'text-muted-foreground'
                    )}>
                      {dayLabel}
                    </p>
                    <div className="flex gap-2">
                      {(['lunch', 'dinner'] as const).map(type => {
                        const isSelected = isCurrentDate && currentSlot?.slot_type === type
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => assign(iso, type)}
                            disabled={loading}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[13px] font-semibold border transition-colors',
                              isSelected
                                ? 'bg-amber-100 border-amber-400 text-amber-700'
                                : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                            )}
                          >
                            <span>{type === 'lunch' ? '☀️' : '🌙'}</span>
                            {SLOT_LABELS[type]}
                            {isSelected && <span className="text-[10px]">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
