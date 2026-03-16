'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import CategoryIcon from '@/components/expenses/CategoryIcon'
import { formatCurrency, formatDate } from '@/lib/formatting'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'

interface ExpenseDetailReportProps {
  expenses: ExpenseWithSplits[]
  participantMap: Map<string, TripParticipant>
}

export default function ExpenseDetailReport({ expenses, participantMap }: ExpenseDetailReportProps) {
  const [open, setOpen] = useState(false)

  if (expenses.length === 0) return null

  return (
    <div className="bg-card card-shadow rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">
          Detailbericht · {expenses.length} Ausgaben
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border/50">
          {expenses.map(expense => {
            const totalShares = expense.expense_splits.reduce((s, sp) => s + sp.shares, 0)
            const payer = participantMap.get(expense.paid_by_participant_id)
            return (
              <div key={expense.id} className="px-4 py-3.5">
                {/* Expense header */}
                <div className="flex items-center gap-3 mb-2.5">
                  <CategoryIcon category={expense.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{expense.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(expense.expense_date as string)}
                      {' · '}bezahlt von{' '}
                      <span className="font-medium text-foreground">{payer?.name ?? 'Unbekannt'}</span>
                    </p>
                  </div>
                  <p className="font-bold text-sm text-foreground flex-shrink-0">
                    {formatCurrency(expense.amount_cents)}
                  </p>
                </div>

                {/* Splits per participant */}
                <div className="ml-9 space-y-1">
                  {expense.expense_splits.map(split => {
                    const participant = participantMap.get(split.participant_id)
                    const amount = totalShares > 0
                      ? Math.round(expense.amount_cents * split.shares / totalShares)
                      : 0
                    const percent = totalShares > 0
                      ? Math.round(split.shares / totalShares * 100)
                      : 0
                    return (
                      <div key={split.participant_id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {participant?.name ?? '–'}
                          <span className="text-muted-foreground/50 ml-1">({percent}%)</span>
                        </span>
                        <span className="font-semibold text-muted-foreground">{formatCurrency(amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
