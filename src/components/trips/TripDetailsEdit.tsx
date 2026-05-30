'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Save, X } from 'lucide-react'

interface TripDetailsEditProps {
  tripId: string
  name: string
  startDate: string | null
  endDate: string | null
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TripDetailsEdit({ tripId, name, startDate, endDate }: TripDetailsEditProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [tripName, setTripName] = useState(name)
  const [start, setStart] = useState(startDate ?? '')
  const [end, setEnd] = useState(endDate ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!tripName.trim()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name: tripName.trim() }
      if (start) body.startDate = start
      if (end) body.endDate = end
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Fehler')
      }
      toast.success('Gespeichert')
      setEditing(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTripName(name)
    setStart(startDate ?? '')
    setEnd(endDate ?? '')
    setEditing(false)
  }

  return (
    <div className="bg-card card-shadow rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Pencil className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex-1">Reisedaten</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Bearbeiten
          </button>
        )}
      </div>

      <div className="px-4 py-3.5">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                Name *
              </label>
              <input
                type="text"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                maxLength={100}
                required
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Beginn
                </label>
                <input
                  type="date"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Ende
                </label>
                <input
                  type="date"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  min={start || undefined}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[13px]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !tripName.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-white text-[13px] font-bold disabled:opacity-50 transition-opacity active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={2} />
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center justify-center px-3 py-2 rounded-xl bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            {(startDate || endDate) && (
              <p className="text-xs text-muted-foreground">
                {startDate ? formatDate(startDate) : '?'} – {endDate ? formatDate(endDate) : '?'}
              </p>
            )}
            {!startDate && !endDate && (
              <p className="text-xs text-muted-foreground">Kein Datum gesetzt</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
