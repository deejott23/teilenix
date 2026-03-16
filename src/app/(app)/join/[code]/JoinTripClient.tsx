'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plane, Users } from 'lucide-react'

interface JoinTripClientProps {
  trip: {
    id: string
    name: string
    status: string
    participant_count: number
  }
  alreadyJoined: boolean
}

export default function JoinTripClient({ trip, alreadyJoined }: JoinTripClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (alreadyJoined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Bereits dabei!</h1>
        <p className="text-muted-foreground text-sm mb-6">Du bist dieser Reise bereits beigetreten.</p>
        <Link href={`/trips/${trip.id}`}>
          <Button className="rounded-xl font-semibold">Zur Reise</Button>
        </Link>
      </div>
    )
  }

  const handleJoin = async () => {
    setLoading(true)
    try {
      const joinRes = await fetch(`/api/trips/${trip.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!joinRes.ok) {
        const err = await joinRes.json()
        throw new Error(err.error ?? 'Beitreten fehlgeschlagen')
      }
      toast.success(`Du bist "${trip.name}" beigetreten!`)
      router.push(`/trips/${trip.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-4">

        {/* Trip header */}
        <div className="bg-white rounded-[18px] card-shadow p-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-3">
            <Plane className="w-6 h-6 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{trip.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Einladung offen
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
            <Users className="w-4 h-4" strokeWidth={2} />
            <span>{trip.participant_count} {trip.participant_count === 1 ? 'Teilnehmer' : 'Teilnehmer'} dabei</span>
          </div>
        </div>

        {/* Join button */}
        <div className="bg-white rounded-[18px] card-shadow p-5 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Tritt dieser Reise bei, um Ausgaben einzusehen und hinzuzufügen.
          </p>
          <Button onClick={handleJoin} disabled={loading} className="w-full rounded-xl font-semibold">
            {loading ? 'Wird beigetreten…' : 'Jetzt beitreten'}
          </Button>
        </div>

      </div>
    </div>
  )
}
