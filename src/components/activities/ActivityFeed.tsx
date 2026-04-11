'use client'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query/queryKeys'
import dynamic from 'next/dynamic'
import ActivityCard from './ActivityCard'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

const AddActivitySheet = dynamic(() => import('./AddActivitySheet'), { ssr: false })

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

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

type FilterKey = 'all' | 'confirmed' | 'idea'
type DateFilter = string | 'undated' | null // null = all dates

interface ActivityFeedProps {
  tripId: string
  initialActivities: ActivityWithVotes[]
  participants: TripParticipant[]
  myParticipantId: string
  tripStartDate: string | null
  tripEndDate: string | null
  isActive: boolean
}

export default function ActivityFeed({
  tripId,
  initialActivities,
  participants,
  myParticipantId,
  tripStartDate,
  tripEndDate,
  isActive,
}: ActivityFeedProps) {
  const queryClient = useQueryClient()
  const [activities, setActivities] = useState(initialActivities)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>(null)
  const [showSheet, setShowSheet] = useState(false)

  useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  const tripDates = generateDateRange(tripStartDate, tripEndDate)

  const handleAdd = async (data: object) => {
    const res = await fetch(`/api/trips/${tripId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    const newActivity: ActivityWithVotes = await res.json()
    // Optimistic: add to local state immediately
    setActivities(prev => [...prev, newActivity])
    toast.success('Ausflug vorgeschlagen!')
    // Background sync
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byTrip(tripId) })
  }

  // Filter activities
  const filtered = activities.filter(a => {
    if (filter === 'confirmed' && a.status !== 'confirmed') return false
    if (filter === 'idea' && a.status !== 'idea') return false
    if (dateFilter === 'undated') return !a.activity_date
    if (dateFilter) return a.activity_date === dateFilter
    return true
  })

  // Sort: confirmed first, then by date, then by created_at
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'confirmed' && b.status !== 'confirmed') return -1
    if (a.status !== 'confirmed' && b.status === 'confirmed') return 1
    if (a.activity_date && b.activity_date) return a.activity_date.localeCompare(b.activity_date)
    if (a.activity_date && !b.activity_date) return -1
    if (!a.activity_date && b.activity_date) return 1
    return a.created_at.localeCompare(b.created_at)
  })

  // Dots for calendar strip
  const confirmedDates = new Set(activities.filter(a => a.status === 'confirmed' && a.activity_date).map(a => a.activity_date!))
  const ideaDates = new Set(activities.filter(a => a.status === 'idea' && a.activity_date).map(a => a.activity_date!))
  const hasUndated = activities.some(a => !a.activity_date)

  const confirmedCount = activities.filter(a => a.status === 'confirmed').length
  const ideaCount = activities.filter(a => a.status === 'idea').length

  return (
    <div className="space-y-4 pb-[90px] md:pb-6">
      {/* Calendar date strip */}
      {tripDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-0.5 px-0.5">
          <button
            type="button"
            onClick={() => setDateFilter(null)}
            className={cn(
              'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-bold border-[1.5px] transition-all min-w-[48px]',
              dateFilter === null
                ? 'bg-primary border-primary text-white'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <span className="text-[12px]">Alle</span>
          </button>
          {tripDates.map(d => {
            const iso = toISODate(d)
            const isSelected = dateFilter === iso
            const hasConfirmed = confirmedDates.has(iso)
            const hasIdea = ideaDates.has(iso)
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDateFilter(isSelected ? null : iso)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-bold border-[1.5px] transition-all min-w-[48px]',
                  isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <span className={cn('text-[10px] font-semibold', isSelected ? 'text-white/80' : 'opacity-60')}>
                  {WEEKDAY_SHORT[d.getDay()]}
                </span>
                <span className="text-[14px] font-bold">{d.getDate()}</span>
                <div className="flex gap-0.5 mt-0.5 h-1.5">
                  {hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                  {hasIdea && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
              </button>
            )
          })}
          {hasUndated && (
            <button
              type="button"
              onClick={() => setDateFilter(dateFilter === 'undated' ? null : 'undated')}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-bold border-[1.5px] transition-all',
                dateFilter === 'undated'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <span>📅</span>
              <span className="mt-0.5">Offen</span>
            </button>
          )}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2">
        {([
          { key: 'all',       label: `Alle (${activities.length})` },
          { key: 'confirmed', label: `✓ Bestätigt (${confirmedCount})` },
          { key: 'idea',      label: `💡 Ideen (${ideaCount})` },
        ] as { key: FilterKey; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[12px] font-semibold border-[1.5px] transition-all',
              filter === key
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-[48px] block mb-3">🗺️</span>
          <p className="text-[15px] font-bold text-foreground mb-1">
            {activities.length === 0 ? 'Noch keine Ausflüge' : 'Keine Treffer'}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {activities.length === 0
              ? 'Schlage den ersten Ausflug vor!'
              : 'Versuche einen anderen Filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              myParticipantId={myParticipantId}
              tripId={tripId}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      {isActive && myParticipantId && (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="fixed bottom-[84px] md:bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white font-bold text-[14px] shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Ausflug vorschlagen
        </button>
      )}

      {/* Sheet */}
      {showSheet && (
        <AddActivitySheet
          tripId={tripId}
          myParticipantId={myParticipantId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          onClose={() => setShowSheet(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
