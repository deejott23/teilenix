'use client'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { queryKeys } from '@/lib/query/queryKeys'
import dynamic from 'next/dynamic'
import AusflugPinwand from './AusflugPinwand'
import type { ActivityWithVotes, TripParticipant } from '@/types/app'

const AddActivitySheet = dynamic(() => import('./AddActivitySheet'), { ssr: false })

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
  myParticipantId,
  tripStartDate,
  tripEndDate,
  isActive,
}: ActivityFeedProps) {
  const queryClient = useQueryClient()
  const [activities, setActivities] = useState(initialActivities)
  const [showSheet, setShowSheet] = useState(false)

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
    const raw = await res.json()
    const newActivity: ActivityWithVotes = { ...raw, votes: [], creator_name: '' }
    setActivities(prev => [...prev, newActivity])
    toast.success('Ausflug vorgeschlagen!')
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byTrip(tripId) })
  }

  return (
    <div className="space-y-4 pb-[90px] md:pb-6">
      <AusflugPinwand activities={activities} tripId={tripId} />

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

      {showSheet && (
        <AddActivitySheet
          tripId={tripId}
          myParticipantId={myParticipantId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          defaultDate={null}
          onClose={() => setShowSheet(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
