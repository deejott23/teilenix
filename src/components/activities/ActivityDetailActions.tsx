'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import VoteButtons from './VoteButtons'
import type { ActivityVote, ActivityStatus, ActivityType } from '@/types/app'

const AddActivitySheet = dynamic(() => import('./AddActivitySheet'), { ssr: false })

export interface ActivityInitialData {
  title: string
  activity_type: ActivityType
  description: string | null
  link: string | null
  departure_time: string | null
  duration_label: string | null
  meeting_point: string | null
  cost_per_person_cents: number | null
  activity_date: string | null
}

export default function ActivityDetailActions({
  activityId, tripId, myParticipantId, initialVotes, isActive, isMyActivity, currentStatus,
  initialData, tripStartDate, tripEndDate,
}: {
  activityId: string
  tripId: string
  myParticipantId: string
  initialVotes: ActivityVote[]
  isActive: boolean
  isMyActivity: boolean
  currentStatus: ActivityStatus
  initialData: ActivityInitialData
  tripStartDate: string | null
  tripEndDate: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleEdit = async (data: object) => {
    const res = await fetch(`/api/trips/${tripId}/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    toast.success('Gespeichert')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Ausflug wirklich löschen?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/activities/${activityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Gelöscht')
      router.push(`/trips/${tripId}/planen`)
    } catch {
      toast.error('Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {myParticipantId && (
        <VoteButtons
          activityId={activityId}
          tripId={tripId}
          participantId={myParticipantId}
          initialVotes={initialVotes}
        />
      )}

      {isMyActivity && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[12px] bg-muted text-foreground font-semibold text-[13px] hover:bg-muted/80 active:scale-[0.98] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[12px] bg-destructive/10 text-destructive font-semibold text-[13px] hover:bg-destructive/20 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            Löschen
          </button>
        </div>
      )}

      {showEdit && (
        <AddActivitySheet
          tripId={tripId}
          myParticipantId={myParticipantId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          initialValues={initialData}
          onClose={() => setShowEdit(false)}
          onAdd={async (data) => {
            await handleEdit(data)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
