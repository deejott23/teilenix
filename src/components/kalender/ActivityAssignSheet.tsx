'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activityTypeEmoji } from '@/lib/activities'
import type { ActivityWithVotes } from '@/types/app'

interface ActivityAssignSheetProps {
  tripId: string
  slotDate: string
  activities: ActivityWithVotes[]
  currentActivityIds: string[]
  onClose: () => void
  onRefresh: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default function ActivityAssignSheet({
  tripId,
  slotDate,
  activities,
  currentActivityIds,
  onClose,
  onRefresh,
}: ActivityAssignSheetProps) {
  const [loading, setLoading] = useState(false)

  const assign = async (activityId: string, date: string | null) => {
    setLoading(true)
    try {
      await fetch(`/api/trips/${tripId}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_date: date }),
      })
      onRefresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const assigned = activities.filter(a => currentActivityIds.includes(a.id))
  const available = activities.filter(a => !currentActivityIds.includes(a.id))

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Ausflug einplanen</h2>
            <p className="text-[12px] text-muted-foreground">{formatDate(slotDate)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 pb-10 space-y-1">
          {/* Currently assigned on this date — allow removal */}
          {assigned.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Heute eingeplant
              </p>
              {assigned.map(a => {
                const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type] ?? '📍'
                const yesCount = a.votes.filter(v => v.vote === 'yes').length
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => assign(a.id, null)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-primary/8 border border-primary/20 text-left hover:bg-primary/12 transition-colors"
                  >
                    <span className="text-[20px] flex-shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">Tippen zum Entfernen</p>
                    </div>
                    <span className="text-[11px] font-bold text-primary flex-shrink-0">✓ Aktuell</span>
                    {yesCount > 0 && <span className="text-[12px] text-muted-foreground flex-shrink-0">😄{yesCount}</span>}
                  </button>
                )
              })}
              <div className="border-t border-border my-2" />
            </>
          )}

          {/* Available to assign */}
          {available.length === 0 && assigned.length === 0 && (
            <p className="text-center py-8 text-[13px] text-muted-foreground">
              Keine Ausflug-Ideen vorhanden. Schlage zuerst einen Ausflug vor!
            </p>
          )}
          {available.length === 0 && assigned.length > 0 && (
            <p className="text-center py-4 text-[12px] text-muted-foreground">
              Keine weiteren Ideen verfügbar.
            </p>
          )}

          {available.map(a => {
            const emoji = a.cover_emoji ?? activityTypeEmoji[a.activity_type] ?? '📍'
            const yesCount = a.votes.filter(v => v.vote === 'yes').length
            const isAlreadyScheduled = !!a.activity_date && a.activity_date !== slotDate
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => assign(a.id, slotDate)}
                disabled={loading}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors hover:bg-muted',
                  isAlreadyScheduled && 'opacity-60'
                )}
              >
                <span className="text-[20px] flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isAlreadyScheduled
                      ? `Umplanen von ${new Date(a.activity_date! + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`
                      : a.status === 'confirmed' ? '✓ Bestätigt' : '💡 Idee'}
                  </p>
                </div>
                {yesCount > 0 && (
                  <span className="text-[12px] text-muted-foreground flex-shrink-0">😄{yesCount}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
