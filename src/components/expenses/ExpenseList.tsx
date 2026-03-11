import { formatDateLong } from '@/lib/formatting'
import ExpenseCard from './ExpenseCard'
import type { ExpenseWithSplits } from '@/types/app'
import { Receipt } from 'lucide-react'

interface ExpenseListProps {
  expenses: ExpenseWithSplits[]
  myFamilyId: string
  tripId: string
  canEdit: boolean
}

export default function ExpenseList({ expenses, myFamilyId, tripId, canEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-2xl mb-3">
          <Receipt className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-700 mb-1">Noch keine Ausgaben</h3>
        <p className="text-sm text-gray-400">Füge die erste Ausgabe hinzu.</p>
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {formatDateLong(date)}
          </p>
          <div className="space-y-2">
            {dayExpenses.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                myFamilyId={myFamilyId}
                tripId={tripId}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
