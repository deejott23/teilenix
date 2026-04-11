'use client'

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { formatDateLong } from '@/lib/formatting'
import ExpenseCard from './ExpenseCard'
import type { ExpenseWithSplits, TripParticipant } from '@/types/app'
import { Receipt } from 'lucide-react'

interface ExpenseListProps {
  expenses: ExpenseWithSplits[]
  myParticipantId: string
  tripId: string
  canEdit: boolean
  participantMap?: Map<string, TripParticipant>
}

type Row =
  | { kind: 'header'; date: string }
  | { kind: 'expense'; expense: ExpenseWithSplits }

export default function ExpenseList({ expenses, myParticipantId, tripId, canEdit, participantMap }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-muted rounded-2xl mb-3">
          <Receipt className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <h3 className="font-medium text-foreground mb-1">Noch keine Ausgaben</h3>
        <p className="text-sm text-muted-foreground">Füge die erste Ausgabe hinzu.</p>
      </div>
    )
  }

  return <VirtualExpenseList expenses={expenses} myParticipantId={myParticipantId} tripId={tripId} canEdit={canEdit} participantMap={participantMap} />
}

function VirtualExpenseList({ expenses, myParticipantId, tripId, canEdit, participantMap }: ExpenseListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Flatten grouped rows: header + expenses per date
  const rows = useMemo<Row[]>(() => {
    const grouped = new Map<string, ExpenseWithSplits[]>()
    expenses.forEach(expense => {
      const date = expense.expense_date
      if (!grouped.has(date)) grouped.set(date, [])
      grouped.get(date)!.push(expense)
    })
    const result: Row[] = []
    grouped.forEach((dayExpenses, date) => {
      result.push({ kind: 'header', date })
      dayExpenses.forEach(expense => result.push({ kind: 'expense', expense }))
    })
    return result
  }, [expenses])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      return row.kind === 'header' ? 28 : 80
    },
    overscan: 5,
  })

  return (
    <div ref={parentRef} style={{ overflowY: 'auto', maxHeight: 'calc(100dvh - 200px)' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}
            >
              {row.kind === 'header' ? (
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2 px-1 pt-3 first:pt-0">
                  {formatDateLong(row.date)}
                </p>
              ) : (
                <div className="pb-2">
                  <ExpenseCard
                    expense={row.expense}
                    myParticipantId={myParticipantId}
                    tripId={tripId}
                    canEdit={canEdit}
                    participantMap={participantMap}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
