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

  // Group by date
  const grouped = new Map<string, ExpenseWithSplits[]>()
  expenses.forEach(expense => {
    const date = expense.expense_date
    if (!grouped.has(date)) grouped.set(date, [])
    grouped.get(date)!.push(expense)
  })

  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([date, dayExpenses]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2 px-1">
            {formatDateLong(date)}
          </p>
          <div className="space-y-2">
            {dayExpenses.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                myParticipantId={myParticipantId}
                tripId={tripId}
                canEdit={canEdit}
                participantMap={participantMap}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
