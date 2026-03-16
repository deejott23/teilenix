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
            <DialogTitle>Reise beenden?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Wenn du die Reise beendest, können keine neuen Ausgaben mehr hinzugefügt werden.
            Die Abrechnung wird erstellt und ist für alle Mitreisenden sichtbar.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEnd} disabled={loading}>
              {loading ? 'Wird beendet...' : 'Reise beenden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
