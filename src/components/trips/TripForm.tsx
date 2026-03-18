'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTripSchema, type CreateTripInput } from '@/lib/validations/trip'
import { todayISO } from '@/lib/formatting'

const TRIP_EMOJIS = [
  '🌍', '🌴', '🏔️', '🏖️', '🗺️', '🌅', '⛵', '🏕️',
  '✈️', '🚂', '🚗', '🚢', '🗼', '🏰', '🌊', '🎿',
  '🏄', '🧗', '🎭', '🌋', '🏜️', '🎪', '🌺', '🎡',
]

export default function TripForm() {
  const router = useRouter()
  const [selectedEmoji, setSelectedEmoji] = useState('🌍')

  const form = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: todayISO(),
      endDate: '',
    },
  })

  const onSubmit = async (data: CreateTripInput) => {
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, coverEmoji: selectedEmoji }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler')
      }
      const { trip } = await res.json()
      toast.success('Reise erstellt!')
      router.push(`/trips/${trip.id}?new=1`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

      {/* Emoji picker */}
      <div className="space-y-2">
        <Label>Reise-Icon</Label>
        <div className="bg-card border border-border rounded-2xl p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
              {selectedEmoji}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Wähle ein Icon für deine Reise. Es erscheint in der Liste und im Reise-Header.
            </p>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {TRIP_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-full aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                  selectedEmoji === emoji
                    ? 'bg-primary text-primary-foreground shadow-sm scale-110'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Reisename *</Label>
        <Input
          id="name"
          placeholder="z.B. Sommerurlaub 2025"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung (optional)</Label>
        <Input
          id="description"
          placeholder="z.B. Mallorca mit den Müllers"
          {...form.register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Startdatum</Label>
          <Input id="startDate" type="date" {...form.register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Enddatum</Label>
          <Input id="endDate" type="date" {...form.register('endDate')} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Wird erstellt...' : 'Reise erstellen'}
      </Button>
    </form>
  )
}
