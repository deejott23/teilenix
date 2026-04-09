'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { ExpenseSplitInput } from '@/types/app'
import { formatCurrency } from '@/lib/formatting'
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

  const includedCount = splits.filter(s => s.included).length
  const includedSplits = splits.filter(s => s.included)
  const totalShares = includedSplits.reduce((s, sp) => s + sp.shares, 0)

  return (
    <div className="space-y-2">
      {splits.map((split, index) => {
        const amt = split.included && totalShares > 0 && totalCents > 0
          ? Math.round(totalCents * split.shares / totalShares)
          : 0

        return (
          <div
            key={split.participantId}
            className={`rounded-xl border transition-colors ${
              split.included ? 'border-primary/20 bg-primary/5' : 'border-border bg-card opacity-50'
            }`}
          >
            {/* Main row: checkbox | name | stepper */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Checkbox
                checked={split.included}
                onCheckedChange={checked => updateSplit(index, { included: !!checked })}
              />

              <span className="flex-1 text-[13px] font-semibold text-foreground truncate min-w-0">
                {split.participantName}
              </span>

              {/* Shares stepper — buttons only, no text input */}
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
            </div>

            {/* Amount row — only when included and amount is calculable */}
            {amt > 0 && (
              <div className="flex items-center justify-between px-3 pb-2 -mt-1">
                <span className="text-[11px] text-muted-foreground">
                  {split.shares > 1 ? `${split.shares} Anteile` : '1 Anteil'}
                </span>
                <span className="text-[12px] font-bold text-primary tabular-nums">
                  {formatCurrency(amt)}
                </span>
              </div>
            )}
          </div>
        )
      })}

      {includedCount === 0 && (
        <p className="text-[12px] text-destructive text-center py-2">
          Bitte wähle mindestens einen Teilnehmer aus.
        </p>
      )}
    </div>
  )
}
