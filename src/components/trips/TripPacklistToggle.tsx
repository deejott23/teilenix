'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'

interface TripPacklistToggleProps {
  tripId: string
  showPacklist: boolean
}

export default function TripPacklistToggle({ tripId, showPacklist: initial }: TripPacklistToggleProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initial)
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    const next = !enabled
    setEnabled(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showPacklist: next }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      router.refresh()
    } catch (e: unknown) {
      setEnabled(!next)
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card card-shadow rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <ClipboardList className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex-1">Funktionen</h2>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="text-xl w-8 text-center flex-shrink-0">🎒</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Packliste</p>
          <p className="text-xs text-muted-foreground mt-0.5">Packliste & Einkaufszettel im Listen-Tab anzeigen</p>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className="flex-shrink-0"
          aria-label={enabled ? 'Packliste deaktivieren' : 'Packliste aktivieren'}
        >
          <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${enabled ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </div>
  )
}
