'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Trash2 } from 'lucide-react'
import VoteButtons from './VoteButtons'
import type { ActivityVote, ActivityStatus } from '@/types/app'

export default function ActivityDetailActions({
  activityId, tripId, myParticipantId, initialVotes, isActive, isMyActivity, currentStatus,
}: {
  activityId: string
  tripId: string
  myParticipantId: string
  initialVotes: ActivityVote[]
  isActive: boolean
  isMyActivity: boolean
  currentStatus: ActivityStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Ausflug bestätigt! ✓')
      router.refresh()
    } catch {
      toast.error('Fehler')
    } finally {
      setLoading(false)
    }
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
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-[12px] bg-destructive/10 text-destructive font-semibold text-[13px] hover:bg-destructive/20 active:scale-[0.98] transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          Ausflug löschen
        </button>
      )}
    </div>
  )
}
