'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { todayISO } from '@/lib/formatting'
import { queryKeys } from '@/lib/query/queryKeys'
import type { TripParticipant } from '@/types/app'

interface PartialPaymentSheetProps {
  tripId: string
  participants: TripParticipant[]
}

export default function PartialPaymentSheet({ tripId, participants }: PartialPaymentSheetProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Only billable participants (non-group members, i.e. not group_id set)
  const billable = participants.filter(p => !p.group_id)

  const reset = () => {
    setFromId(''); setToId(''); setAmount(''); setDate(todayISO()); setNote('')
  }

  const handleClose = () => { setOpen(false); reset() }

  const handleSubmit = async () => {
    if (!fromId || !toId || fromId === toId || !amount) return
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (!cents || cents <= 0) { toast.error('Ungültiger Betrag'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          paidByParticipantId: fromId,
          title: note.trim() || 'Teilzahlung',
          amountCents: cents,
          currency: 'EUR',
          category: 'payment',
          expenseDate: date,
          splitMode: 'custom',
          splits: [{ participantId: toId, shares: 1 }],
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Teilzahlung erfasst')
      handleClose()
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.withSplits(tripId) })
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = fromId && toId && fromId !== toId && amount && !saving

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/8 text-primary text-[13px] font-semibold border border-primary/20 hover:bg-primary/12 active:scale-95 transition-all"
      >
        <Icon name="add" size={16} />
        Teilzahlung erfassen
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-5 pb-10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="w-9 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-foreground">Teilzahlung erfassen</h3>
              <button type="button" onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Wer hat schon direkt bezahlt? Die Teilzahlung wird in der Abrechnung berücksichtigt.
            </p>

            <div className="space-y-3">
              {/* Von → An */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Von</label>
                  <select
                    value={fromId}
                    onChange={e => setFromId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium appearance-none"
                  >
                    <option value="">— Zahler wählen —</option>
                    {billable.filter(p => p.id !== toId).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xl text-muted-foreground mt-5">→</div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">An</label>
                  <select
                    value={toId}
                    onChange={e => setToId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium appearance-none"
                  >
                    <option value="">— Empfänger wählen —</option>
                    {billable.filter(p => p.id !== fromId).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Betrag + Datum */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Betrag (€)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Datum</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium"
                  />
                </div>
              </div>

              {/* Notiz */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Notiz (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="z.B. Vorauszahlung Hotel"
                  maxLength={100}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'mt-5 w-full h-11 rounded-xl font-semibold text-[14px] transition-all',
                canSubmit
                  ? 'bg-primary text-white active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {saving ? 'Wird gespeichert…' : 'Teilzahlung speichern'}
            </button>
          </div>
        </>
      )}
    </>
  )
}
