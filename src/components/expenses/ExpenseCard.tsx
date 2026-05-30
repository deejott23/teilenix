'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/queryKeys'
import CategoryIcon from './CategoryIcon'
import { Icon } from '@/components/ui/icon'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'
import { cn } from '@/lib/utils'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  myParticipantId: string
  tripId: string
  canEdit: boolean
  participantMap?: Map<string, TripParticipant>
}

export default function ExpenseCard({ expense, myParticipantId, tripId, canEdit, participantMap }: ExpenseCardProps) {
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  const myParticipantSplit = expense.expense_splits.find(s => s.participant_id === myParticipantId)
  const totalShares   = expense.expense_splits.reduce((sum, s) => sum + s.shares, 0)
  const myOwed        = myParticipantSplit ? Math.round(expense.amount_cents * myParticipantSplit.shares / totalShares) : 0
  const iPaid         = expense.paid_by_participant_id === myParticipantId

  // If payer belongs to a group, show the group name instead
  const payer = expense.participant
  const payerGroup = payer?.group_id && participantMap ? participantMap.get(payer.group_id) : null
  const payerName = payerGroup?.name ?? payer?.name ?? 'Unbekannt'

  // Co-payer names
  const coPayers = expense.co_payers ?? []
  const coPayerNames = participantMap
    ? coPayers.map(cp => {
        const cp_p = participantMap.get(cp.participant_id)
        const cp_g = cp_p?.group_id ? participantMap.get(cp_p.group_id) : null
        return cp_g?.name ?? cp_p?.name ?? null
      }).filter(Boolean)
    : []

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Ausgabe löschen?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Ausgabe gelöscht')
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.withSplits(tripId) })
    } catch {
      toast.error('Fehler beim Löschen')
    } finally {
      setDeleting(false)
    }
  }

  // Special rendering for partial payments
  if (expense.category === 'payment') {
    const recipientSplit = expense.expense_splits[0]
    const recipientName = recipientSplit
      ? (participantMap?.get(recipientSplit.participant_id)?.name ?? 'Unbekannt')
      : 'Unbekannt'
    return (
      <div className="bg-green-50 border border-green-200 rounded-[18px] p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-lg flex-shrink-0">💸</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-green-800 text-[13px] truncate leading-tight">
            {expense.title === 'Teilzahlung' ? 'Teilzahlung' : expense.title}
          </p>
          <p className="text-xs text-green-700/70 mt-0.5">
            {payerName} → {recipientName}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-green-800 text-[13px]">{formatCurrency(expense.amount_cents)}</p>
          <p className="text-[10px] text-green-700/60">Teilzahlung</p>
        </div>
        {canEdit && (
          <button onClick={handleDelete} disabled={deleting}
            className="p-1.5 text-green-700/30 hover:text-destructive rounded-lg hover:bg-destructive/8 transition-colors">
            <Icon name="delete" size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-[18px] card-shadow p-4 flex items-center gap-3.5">
      <CategoryIcon category={expense.category} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-[14px] truncate leading-tight">{expense.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className={cn(iPaid && 'text-primary font-semibold')}>{payerName}</span>
          {coPayerNames.length > 0 && (
            <span className="text-muted-foreground/70">{' + '}{coPayerNames.join(', ')}</span>
          )}
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
            <Icon name="edit" size={16} />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/8 transition-colors"
          >
            <Icon name="delete" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
