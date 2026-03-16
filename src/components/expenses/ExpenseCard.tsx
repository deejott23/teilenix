'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import CategoryIcon from './CategoryIcon'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import type { ExpenseWithSplits } from '@/types/app'
import { cn } from '@/lib/utils'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  myParticipantId: string
  tripId: string
  canEdit: boolean
}

export default function ExpenseCard({ expense, myParticipantId, tripId, canEdit }: ExpenseCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const myParticipantSplit = expense.expense_splits.find(s => s.participant_id === myParticipantId)
  const totalShares   = expense.expense_splits.reduce((sum, s) => sum + s.shares, 0)
  const myOwed        = myParticipantSplit ? Math.round(expense.amount_cents * myParticipantSplit.shares / totalShares) : 0
  const iPaid         = expense.paid_by_participant_id === myParticipantId

  const payerName = expense.participant?.name ?? 'Unbekannt'

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Ausgabe löschen?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Ausgabe gelöscht')
      router.refresh()
    } catch {
      toast.error('Fehler beim Löschen')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-card rounded-[18px] card-shadow p-4 flex items-center gap-3.5">
      <CategoryIcon category={expense.category} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-[14px] truncate leading-tight">{expense.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className={cn(iPaid && 'text-primary font-semibold')}>{payerName}</span>
          {' · '}{categoryLabels[expense.category as keyof typeof categoryLabels] ?? expense.category}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-foreground text-[14px]">{formatCurrency(expense.amount_cents)}</p>
        {myParticipantSplit ? (
          <p className="text-[11px] text-muted-foreground">dein: {formatCurrency(myOwed)}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground/50">—</p>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-0.5">
          <Link
            href={`/trips/${tripId}/expenses/${expense.id}/edit`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 text-muted-foreground/30 hover:text-primary rounded-lg hover:bg-primary/8 transition-colors"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.8} />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/8 transition-colors"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  )
}
