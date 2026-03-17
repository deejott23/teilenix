'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { ExpenseSplitInput } from '@/types/app'
import { formatCurrency } from '@/lib/formatting'

interface SplitOverrideEditorProps {
  splits: ExpenseSplitInput[]
  onChange: (splits: ExpenseSplitInput[]) => void
  totalCents?: number
}

export default function SplitOverrideEditor({ splits, onChange, totalCents = 0 }: SplitOverrideEditorProps) {
  const updateSplit = (index: number, patch: Partial<ExpenseSplitInput>) => {
    const updated = splits.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(updated)
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
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            split.included ? 'border-primary/20 bg-primary/5' : 'border-border bg-card opacity-60'
          }`}
        >
          <Checkbox
            checked={split.included}
            onCheckedChange={checked => updateSplit(index, { included: !!checked })}
          />

          <span className="flex-1 text-sm font-medium text-foreground">
            {split.participantName}
          </span>

          <div className="flex items-center gap-2">
            {amt > 0 && (
              <span className="text-xs font-semibold text-foreground font-mono w-14 text-right">
                {formatCurrency(amt)}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Ant.:</span>
              <Input
                type="number"
                min={1}
                max={50}
                value={split.shares}
                disabled={!split.included}
                onChange={e => updateSplit(index, { shares: parseInt(e.target.value) || 1 })}
                className="w-14 h-8 text-sm text-center"
              />
            </div>
          </div>
        </div>
        )
      })}

      {includedCount === 0 && (
        <p className="text-sm text-red-500 text-center py-2">
          Bitte wähle mindestens einen Teilnehmer aus.
        </p>
      )}
    </div>
  )
}
