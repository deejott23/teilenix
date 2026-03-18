'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TRIP_EMOJIS = [
  '🌍', '🌴', '🏔️', '🏖️', '🗺️', '🌅', '⛵', '🏕️',
  '✈️', '🚂', '🚗', '🚢', '🗼', '🏰', '🌊', '🎿',
  '🏄', '🧗', '🎭', '🌋', '🏜️', '🎪', '🌺', '🎡',
]

interface TripEmojiPickerProps {
  tripId: string
  currentEmoji: string
  canEdit: boolean
}

export default function TripEmojiPicker({ tripId, currentEmoji, canEdit }: TripEmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const pickEmoji = async (emoji: string) => {
    if (emoji === currentEmoji) { setOpen(false); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverEmoji: emoji }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
      setOpen(false)
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => canEdit && setOpen(v => !v)}
        disabled={!canEdit}
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
          canEdit ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
        }`}
        style={{ background: 'rgba(255,255,255,0.15)' }}
        title={canEdit ? 'Icon ändern' : undefined}
      >
        {currentEmoji}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Picker panel */}
          <div className="absolute left-0 top-11 z-50 bg-card border border-border rounded-2xl shadow-xl p-3 w-[220px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              Icon wählen
            </p>
            <div className="grid grid-cols-6 gap-1">
              {TRIP_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => pickEmoji(emoji)}
                  disabled={saving}
                  className={`w-full aspect-square rounded-xl text-lg flex items-center justify-center transition-all ${
                    emoji === currentEmoji
                      ? 'bg-primary/15 ring-2 ring-primary scale-105'
                      : 'hover:bg-muted'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
