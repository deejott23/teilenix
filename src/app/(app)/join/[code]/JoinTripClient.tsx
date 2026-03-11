'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Plane, Users } from 'lucide-react'

interface JoinTripClientProps {
  trip: {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
  }
  familyMember: {
    family_id: string
    families: { name: string; default_shares: number } | null
  } | null
  alreadyJoined: boolean
}

export default function JoinTripClient({ trip, familyMember, alreadyJoined }: JoinTripClientProps) {
  const router = useRouter()
  const [shares, setShares] = useState(
    familyMember?.families?.default_shares ?? 2
  )
  const [loading, setLoading] = useState(false)

  if (alreadyJoined) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">✅</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Bereits dabei!</h1>
        <p className="text-gray-500 text-sm mb-4">Deine Familie ist schon in dieser Reise.</p>
        <Link href={`/trips/${trip.id}`}>
          <Button>Zur Reise</Button>
        </Link>
      </div>
    )
  }

  if (!familyMember) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">👥</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Erstelle zuerst eine Familie</h1>
        <p className="text-gray-500 text-sm mb-4">
          Du brauchst eine Familie, bevor du einer Reise beitreten kannst.
        </p>
        <Link href="/onboarding">
          <Button>Familie erstellen</Button>
        </Link>
      </div>
    )
  }

  const handleJoin = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler')
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Trip info */}
        <div className="bg-gradient-to-r from-primary/10 to-emerald-50 rounded-2xl p-5 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm mb-3">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
          {trip.description && (
            <p className="text-sm text-gray-500 mt-1">{trip.description}</p>
          )}
        </div>

        {/* Join form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-700">
              Beitreten als <span className="font-semibold">{familyMember.families?.name}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shares">Anzahl Anteile (Personenanzahl)</Label>
            <Input
              id="shares"
              type="number"
              min={1}
              max={20}
              value={shares}
              onChange={e => setShares(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-gray-400">
              Standard aus deiner Familie: {familyMember.families?.default_shares} Personen
            </p>
          </div>

          <Button
            onClick={handleJoin}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Wird beigetreten...' : 'Reise beitreten'}
          </Button>
        </div>
      </div>
    </div>
  )
}
