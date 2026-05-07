'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, X } from 'lucide-react'
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

interface ActivityDateAssignerProps {
  tripId: string
  activityId: string
  currentDate: string | null
  tripStartDate: string | null
  tripEndDate: string | null
}

export default function ActivityDateAssigner({
  tripId,
  activityId,
  currentDate,
  tripStartDate,
  tripEndDate,
}: ActivityDateAssignerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dates = generateDates(tripStartDate, tripEndDate)

  const assign = async (date: string | null) => {
    setLoading(true)
    try {
      await fetch(`/api/trips/${tripId}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_date: date }),
      })
      router.refresh()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const currentFormatted = currentDate
    ? new Date(currentDate + 'T00:00:00').toLocaleDateString('de-DE', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null

  return (
    <>
      <div className="bg-card rounded-[18px] card-shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-foreground">Datum einplanen</h2>
          {currentDate && (
            <button
              type="button"
              onClick={() => assign(null)}
              disabled={loading}
              className="text-[11px] text-muted-foreground hover:text-destructive font-semibold transition-colors"
            >
              Entfernen
            </button>
          )}
        </div>

        {currentDate ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="flex-1 text-[13px] font-semibold text-foreground">{currentFormatted}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[12px] font-bold text-primary hover:text-primary/80 transition-colors"
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
                ? 'border-primary/30 text-primary/70 hover:border-primary hover:text-primary'
                : 'border-muted-foreground/20 text-muted-foreground/40 cursor-default'
            )}
          >
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
            {dates.length ? 'Tag auswählen' : 'Kein Reisezeitraum gesetzt'}
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full bg-card rounded-t-3xl max-h-[75vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-[15px] font-bold text-foreground">Tag wählen</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-5 pb-10 space-y-1">
              {currentDate && (
                <>
                  <button
                    type="button"
                    onClick={() => assign(null)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-muted transition-colors"
                  >
                    <span className="text-[20px]">🚫</span>
                    <span className="text-[14px] font-semibold text-muted-foreground">Datum entfernen</span>
                  </button>
                  <div className="border-t border-border my-2" />
                </>
              )}
              {dates.map(date => {
                const iso = toISODate(date)
                const isSelected = iso === currentDate
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => assign(iso)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors',
                      isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                    )}
                  >
                    <span className="text-[20px]">📅</span>
                    <span className="text-[14px] font-semibold text-foreground">
                      {date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-[11px] font-bold text-primary">Aktuell</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
