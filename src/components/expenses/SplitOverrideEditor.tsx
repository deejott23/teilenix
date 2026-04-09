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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
              split.included ? 'border-primary/20 bg-primary/5' : 'border-border bg-card opacity-50'
            }`}
          >
            <Checkbox
              checked={split.included}
              onCheckedChange={checked => updateSplit(index, { included: !!checked })}
            />

            <span className="flex-1 text-[13px] font-semibold text-foreground truncate">
              {split.participantName}
            </span>

            {/* Amount preview */}
            {amt > 0 && (
              <span className="text-[12px] font-bold text-muted-foreground tabular-nums min-w-[48px] text-right">
                {formatCurrency(amt)}
              </span>
            )}

            {/* Shares stepper */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                disabled={!split.included || split.shares <= 1}
                onClick={() => updateSplit(index, { shares: Math.max(1, split.shares - 1) })}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
              >
                <Minus className="w-3 h-3 text-foreground" strokeWidth={2.5} />
              </button>
              <span className="text-[13px] font-bold text-foreground tabular-nums w-6 text-center">
                {split.shares}
              </span>
              <button
                type="button"
                disabled={!split.included || split.shares >= 50}
                onClick={() => updateSplit(index, { shares: Math.min(50, split.shares + 1) })}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
              >
                <Plus className="w-3 h-3 text-foreground" strokeWidth={2.5} />
              </button>
            </div>
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
