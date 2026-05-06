'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityWithVotes } from '@/types/app'

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

interface AusflugKalenderProps {
  activities: ActivityWithVotes[]
  tripId: string
  tripStartDate: string | null
  tripEndDate: string | null
  isActive: boolean
  onAddForDate: (date: string) => void
}

export default function AusflugKalender({
  activities,
  tripId,
  tripStartDate,
  tripEndDate,
  isActive,
  onAddForDate,
}: AusflugKalenderProps) {
  const dates = generateDateRange(tripStartDate, tripEndDate)

  // Group activities by date
  const byDate = new Map<string, ActivityWithVotes[]>()
  const undated: ActivityWithVotes[] = []

  for (const a of activities) {
    if (a.activity_date) {
      const list = byDate.get(a.activity_date) ?? []
      list.push(a)
      byDate.set(a.activity_date, list)
    } else {
      undated.push(a)
    }
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-[48px] block mb-3">📅</span>
        <p className="text-[15px] font-bold text-foreground mb-1">Kein Reisezeitraum gesetzt</p>
        <p className="text-[13px] text-muted-foreground">
          Bitte lege Start- und Enddatum der Reise in den Einstellungen fest.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {dates.map(date => {
        const iso = toISODate(date)
        const dayActivities = byDate.get(iso) ?? []

        return (
          <div key={iso} className="bg-card rounded-[16px] card-shadow border border-border overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
              <p className="text-[13px] font-bold text-foreground">{formatDayHeader(date)}</p>
              {isActive && (
                <button
                  type="button"
                  onClick={() => onAddForDate(iso)}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                  Ausflug
                </button>
              )}
            </div>

            {dayActivities.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-muted-foreground/50 italic">
                Noch kein Ausflug geplant
              </p>
            ) : (
              <div className="divide-y divide-border">
                {dayActivities.map(a => {
                  const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type]
                  const yesCount = a.votes.filter(v => v.vote === 'yes').length
                  return (
                    <Link
                      key={a.id}
                      href={`/trips/${tripId}/planen/${a.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-[20px] flex-shrink-0">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {a.status === 'confirmed' ? '✓ Bestätigt' : '💡 Idee'}
                          {yesCount > 0 && ` · ${yesCount} dabei`}
                        </p>
                      </div>
                      <span className="text-[12px] text-muted-foreground/40 flex-shrink-0">›</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Undated / open ideas */}
      {undated.length > 0 && (
        <div className="bg-card rounded-[16px] card-shadow border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/40">
            <p className="text-[13px] font-bold text-muted-foreground">📌 Noch nicht eingeplant</p>
          </div>
          <div className="divide-y divide-border">
            {undated.map(a => {
              const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type]
              return (
                <Link
                  key={a.id}
                  href={`/trips/${tripId}/planen/${a.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-[20px] flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {a.status === 'confirmed' ? '✓ Bestätigt' : '💡 Idee — noch kein Datum'}
                    </p>
                  </div>
                  <span className="text-[12px] text-muted-foreground/40 flex-shrink-0">›</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
