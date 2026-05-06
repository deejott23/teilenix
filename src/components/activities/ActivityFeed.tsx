'use client'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query/queryKeys'
import dynamic from 'next/dynamic'
import AusflugPinwand from './AusflugPinwand'
import AusflugKalender from './AusflugKalender'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

const AddActivitySheet = dynamic(() => import('./AddActivitySheet'), { ssr: false })

type TabKey = 'pinwand' | 'kalender'

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
  const [tab, setTab] = useState<TabKey>('pinwand')
  const [showSheet, setShowSheet] = useState(false)
  const [addForDate, setAddForDate] = useState<string | null>(null)

  useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  const handleAdd = async (data: object) => {
    const res = await fetch(`/api/trips/${tripId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    const newActivity: ActivityWithVotes = await res.json()
    setActivities(prev => [...prev, newActivity])
    toast.success('Ausflug vorgeschlagen!')
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byTrip(tripId) })
  }

  const handleAddForDate = (date: string) => {
    setAddForDate(date)
    setShowSheet(true)
  }

  return (
    <div className="space-y-4 pb-[90px] md:pb-6">
      {/* Tab switcher */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        {([
          { key: 'pinwand', label: '📌 Pinwand' },
          { key: 'kalender', label: '📅 Kalender' },
        ] as { key: TabKey; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 py-2 text-center text-[12px] font-bold rounded-[10px] transition-all',
              tab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pinwand' && (
        <AusflugPinwand
          activities={activities}
          tripId={tripId}
        />
      )}

      {tab === 'kalender' && (
        <AusflugKalender
          activities={activities}
          tripId={tripId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          isActive={isActive}
          onAddForDate={handleAddForDate}
        />
      )}

      {/* FAB */}
      {isActive && myParticipantId && (
        <button
          type="button"
          onClick={() => { setAddForDate(null); setShowSheet(true) }}
          className="fixed bottom-[84px] md:bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white font-bold text-[14px] shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Ausflug vorschlagen
        </button>
      )}

      {showSheet && (
        <AddActivitySheet
          tripId={tripId}
          myParticipantId={myParticipantId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          defaultDate={addForDate}
          onClose={() => { setShowSheet(false); setAddForDate(null) }}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
