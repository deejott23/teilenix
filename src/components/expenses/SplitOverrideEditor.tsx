'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { ExpenseSplitInput } from '@/types/app'
import { formatCurrency, parseToCents } from '@/lib/formatting'
import { Minus, Plus } from 'lucide-react'

interface SplitOverrideEditorProps {
  splits: ExpenseSplitInput[]
  onChange: (splits: ExpenseSplitInput[]) => void
  totalCents?: number
}

export default function SplitOverrideEditor({ splits, onChange, totalCents = 0 }: SplitOverrideEditorProps) {
  const updateSplit = (index: number, patch: Partial<ExpenseSplitInput>) => {
    onChange(splits.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const includedSplits = splits.filter(s => s.included)

  // Berechne den angezeigten Betrag pro Teilnehmer (für shares-Modus)
  const fixedTotal = includedSplits.reduce((s, sp) => s + (sp.overrideAmountCents ?? 0), 0)
  const remaining = totalCents - fixedTotal
  const shareBasedSplits = includedSplits.filter(s => s.overrideAmountCents == null)
  const totalShares = shareBasedSplits.reduce((s, sp) => s + sp.shares, 0)

  const calcAmt = (split: ExpenseSplitInput): number => {
    if (!split.included) return 0
    if (split.overrideAmountCents != null) return split.overrideAmountCents
    if (totalShares <= 0 || remaining <= 0) return 0
    return Math.round(remaining * split.shares / totalShares)
  }

  return (
    <div className="space-y-2">
      {splits.map((split, index) => {
        const isAmountMode = split.overrideAmountCents != null
        const amt = calcAmt(split)

        // Rohwert für das Betrag-Eingabefeld
        const amtDisplay = split.overrideAmountCents != null
          ? (split.overrideAmountCents / 100).toFixed(2).replace('.', ',')
          : amt > 0 ? (amt / 100).toFixed(2).replace('.', ',') : ''

        return (
          <div
            key={split.participantId}
            className={`rounded-xl border transition-colors ${
              split.included ? 'border-primary/20 bg-primary/5' : 'border-border bg-card opacity-50'
            }`}
          >
            {/* Main row: checkbox | name | stepper oder Betrag-Input */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Checkbox
                checked={split.included}
                onCheckedChange={checked => updateSplit(index, { included: !!checked, overrideAmountCents: undefined })}
              />

              <span className="flex-1 text-[13px] font-semibold text-foreground truncate min-w-0">
                {split.participantName}
              </span>

              {isAmountMode ? (
                /* Betrag-Eingabe */
                <div className="relative flex-shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!split.included}
                    value={amtDisplay}
                    onChange={e => {
                      const cents = parseToCents(e.target.value)
                      updateSplit(index, { overrideAmountCents: isNaN(cents) ? 0 : cents })
                    }}
                    className="h-8 w-24 text-sm text-right pr-6 font-semibold bg-background border border-primary/40 rounded-lg focus:outline-none focus:border-primary text-foreground disabled:opacity-40"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
                </div>
              ) : (
                /* Anteile-Stepper */
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={!split.included || split.shares <= 1}
                    onClick={() => updateSplit(index, { shares: split.shares - 1 })}
                    className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <Minus className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                  </button>

                  <span className="text-[14px] font-bold text-foreground tabular-nums w-6 text-center select-none">
                    {split.shares}
                  </span>

                  <button
                    type="button"
                    disabled={!split.included || split.shares >= 20}
                    onClick={() => updateSplit(index, { shares: split.shares + 1 })}
                    className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <Plus className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer-Zeile: Modus-Toggle + berechneter Betrag */}
            {split.included && (
              <div className="flex items-center justify-between px-3 pb-2 -mt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateSplit(index, isAmountMode
                      ? { overrideAmountCents: undefined }
                      : { overrideAmountCents: amt > 0 ? amt : 0 }
                    )}
                    className="text-[11px] font-semibold text-primary underline underline-offset-2 decoration-dotted"
                  >
                    {isAmountMode ? 'Anteil' : 'Betrag'}
                  </button>
                  <span className="text-[11px] text-muted-foreground/50">·</span>
                  <span className="text-[11px] text-muted-foreground">
                    {isAmountMode
                      ? `${split.shares} ${split.shares > 1 ? 'Anteile' : 'Anteil'}`
                      : `${split.shares} ${split.shares > 1 ? 'Anteile' : 'Anteil'}`}
                  </span>
                </div>
                {amt > 0 && !isAmountMode && (
                  <span className="text-[12px] font-bold text-primary tabular-nums">
                    {formatCurrency(amt)}
                  </span>
                )}
                {isAmountMode && split.overrideAmountCents != null && split.overrideAmountCents > 0 && (
                  <span className="text-[12px] font-bold text-primary tabular-nums">
                    {formatCurrency(split.overrideAmountCents)}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}

      {splits.filter(s => s.included).length === 0 && (
        <p className="text-[12px] text-destructive text-center py-2">
          Bitte wähle mindestens einen Teilnehmer aus.
        </p>
      )}
    </div>
  )
}
