'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, Pencil, Trash2, Check, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TripFamily {
  id: string
  family_id: string
  shares: number
  joined_at: string
  hasExpenses: boolean
  families?: {
    name: string
    default_shares: number
  }
}

interface TripParticipantManagerProps {
  tripId: string
  tripFamilies: TripFamily[]
  isCreator: boolean
  isActive: boolean
  myFamilyId: string
}

export default function TripParticipantManager({
  tripId,
  tripFamilies,
  isCreator,
  isActive,
  myFamilyId,
}: TripParticipantManagerProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editShares, setEditShares] = useState(1)
  const [showRecalcDialog, setShowRecalcDialog] = useState(false)
  const [pendingShares, setPendingShares] = useState<{ familyId: string; shares: number } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const totalShares = tripFamilies.reduce((sum, tf) => sum + tf.shares, 0)

  const hasAnyExpenses = tripFamilies.some(tf => tf.hasExpenses)

  const startEdit = (tf: TripFamily) => {
    setEditingId(tf.family_id)
    setEditShares(tf.shares)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveShares = (familyId: string, newShares: number) => {
    if (hasAnyExpenses) {
      // Show dialog to ask about recalculation
      setPendingShares({ familyId, shares: newShares })
      setShowRecalcDialog(true)
    } else {
      doUpdateShares(familyId, newShares, false)
    }
  }

  const doUpdateShares = async (familyId: string, shares: number, recalculate: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/families/${familyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares, recalculate }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler beim Speichern')
      }
      toast.success('Anteil aktualisiert')
      setEditingId(null)
      setShowRecalcDialog(false)
      setPendingShares(null)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const removeFamily = async (familyId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/families/${familyId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler beim Entfernen')
      }
      toast.success('Gruppe entfernt')
      setRemovingId(null)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-[18px] card-shadow p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
          <h2 className="text-[13px] font-bold text-foreground">
            Abrechnungsgruppen · {tripFamilies.length} {tripFamilies.length === 1 ? 'Gruppe' : 'Gruppen'}
          </h2>
          <span className="ml-auto text-[11px] text-muted-foreground">{totalShares} Personen gesamt</span>
        </div>

        {isCreator && isActive && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Als Reiseersteller kannst du Anteile anpassen und Gruppen entfernen. Änderungen an Anteilen können wahlweise auf bestehende Ausgaben angewendet werden.
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {tripFamilies.map((tf) => {
            const isEditing = editingId === tf.family_id
            const isRemoving = removingId === tf.family_id
            const isMyFamily = tf.family_id === myFamilyId
            const sharePercent = totalShares > 0 ? Math.round((tf.shares / totalShares) * 100) : 0

            if (isRemoving) {
              return (
                <div key={tf.id} className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-semibold text-red-800">
                    &quot;{tf.families?.name}&quot; wirklich entfernen?
                  </p>
                  {tf.hasExpenses ? (
                    <p className="text-xs text-red-600">
                      Diese Gruppe hat bereits Ausgaben erfasst und kann nicht entfernt werden.
                    </p>
                  ) : (
                    <p className="text-xs text-red-600">
                      Die Gruppe wird aus dieser Reise entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => setRemovingId(null)}
                    >
                      Abbrechen
                    </Button>
                    {!tf.hasExpenses && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={() => removeFamily(tf.family_id)}
                        disabled={loading}
                      >
                        Entfernen
                      </Button>
                    )}
                  </div>
                </div>
              )
            }

            if (isEditing) {
              return (
                <div key={tf.id} className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">{tf.families?.name} – Anteil bearbeiten</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editShares}
                      onChange={e => setEditShares(parseInt(e.target.value) || 1)}
                      className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-center"
                    />
                    <span className="text-xs text-muted-foreground">Personen</span>
                    <div className="ml-auto flex gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => saveShares(tf.family_id, editShares)}
                        disabled={loading}
                        className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={tf.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-[13px] font-bold text-primary flex-shrink-0">
                  {tf.families?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-semibold text-foreground truncate">{tf.families?.name}</p>
                    {isMyFamily && (
                      <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full">du</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tf.shares} {tf.shares === 1 ? 'Person' : 'Personen'} · {sharePercent}% Anteil
                  </p>
                </div>
                {isCreator && isActive && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(tf)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title="Anteil bearbeiten"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {!isMyFamily && (
                      <button
                        type="button"
                        onClick={() => setRemovingId(tf.family_id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Gruppe entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recalculation dialog */}
      {showRecalcDialog && pendingShares && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-foreground text-[15px]">Anteile geändert</h3>
            <p className="text-sm text-muted-foreground">
              Diese Reise hat bereits Ausgaben. Wie soll die Änderung angewendet werden?
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => doUpdateShares(pendingShares.familyId, pendingShares.shares, false)}
                disabled={loading}
                className="w-full text-left bg-muted rounded-xl p-3.5 hover:bg-muted/70 transition-colors disabled:opacity-50"
              >
                <p className="font-semibold text-sm text-foreground">Nur für neue Ausgaben</p>
                <p className="text-xs text-muted-foreground mt-0.5">Bisherige Ausgaben bleiben unverändert</p>
              </button>
              <button
                type="button"
                onClick={() => doUpdateShares(pendingShares.familyId, pendingShares.shares, true)}
                disabled={loading}
                className="w-full text-left bg-primary/5 border border-primary/20 rounded-xl p-3.5 hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <p className="font-semibold text-sm text-primary">Alle proportionalen Ausgaben neu berechnen</p>
                <p className="text-xs text-muted-foreground mt-0.5">Individuell aufgeteilte Ausgaben bleiben unverändert</p>
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setShowRecalcDialog(false)
                setPendingShares(null)
                setEditingId(null)
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
