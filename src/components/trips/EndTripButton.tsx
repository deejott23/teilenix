'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function EndTripButton({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEnd = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/end`, { method: 'POST' })
      if (!res.ok) throw new Error('Fehler')
      toast.success('Reise beendet! Abrechnung ist bereit.')
      setOpen(false)
      router.refresh()
      router.push(`/trips/${tripId}/settlement`)
    } catch {
      toast.error('Fehler beim Beenden der Reise')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-muted-foreground border-border"
      >
        <CheckCircle className="w-4 h-4" />
        Reise beenden
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reise wirklich beenden?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wenn du die Reise beendest, können <strong className="text-foreground">keine neuen Ausgaben</strong> mehr hinzugefügt oder bearbeitet werden.
            </p>
            <div className="flex gap-2.5 bg-destructive/8 border border-destructive/20 rounded-xl px-3.5 py-3">
              <span className="text-base flex-shrink-0">⚠️</span>
              <p className="text-xs text-foreground/80 leading-relaxed">
                <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong> Stelle sicher, dass alle Ausgaben vollständig erfasst sind.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleEnd} disabled={loading}>
              {loading ? 'Wird beendet...' : 'Ja, Reise beenden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
