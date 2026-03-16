'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { ExpenseSplitInput } from '@/types/app'

interface SplitOverrideEditorProps {
  splits: ExpenseSplitInput[]
  onChange: (splits: ExpenseSplitInput[]) => void
}

export default function SplitOverrideEditor({ splits, onChange }: SplitOverrideEditorProps) {
  const updateSplit = (index: number, patch: Partial<ExpenseSplitInput>) => {
    const updated = splits.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(updated)
  }

  const includedCount = splits.filter(s => s.included).length

  return (
    <div className="space-y-2">
      {splits.map((split, index) => (
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

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Anteile:</span>
            <Input
              type="number"
              min={1}
              max={50}
              value={split.shares}
              disabled={!split.included}
              onChange={e => updateSplit(index, { shares: parseInt(e.target.value) || 1 })}
              className="w-16 h-8 text-sm text-center"
            />
          </div>
        </div>
      ))}

      {includedCount === 0 && (
        <p className="text-sm text-red-500 text-center py-2">
          Bitte wähle mindestens einen Teilnehmer aus.
        </p>
      )}
    </div>
  )
}
