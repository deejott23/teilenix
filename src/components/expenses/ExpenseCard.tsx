'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import CategoryIcon from './CategoryIcon'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import type { ExpenseWithSplits } from '@/types/app'
import { cn } from '@/lib/utils'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  myFamilyId: string
  tripId: string
  canEdit: boolean
}

export default function ExpenseCard({ expense, myFamilyId, canEdit }: ExpenseCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const myFamilySplit = expense.expense_splits.find(s => s.family_id === myFamilyId)
  const totalShares = expense.expense_splits.reduce((sum, s) => sum + s.shares, 0)
  const myOwed = myFamilySplit
    ? Math.round(expense.amount_cents * myFamilySplit.shares / totalShares)
    : 0

  const iPaid = expense.paid_by_family === myFamilyId

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
    <div
      className={cn(
        'bg-white rounded-xl border p-4 flex items-center gap-3',
        iPaid ? 'border-primary/20' : 'border-gray-100'
      )}
    >
      <CategoryIcon category={expense.category} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{expense.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {expense.families.name} hat bezahlt
          {expense.expense_splits.length < 10 && ` · ${expense.expense_splits.length} Familien`}
        </p>
        <p className="text-xs text-gray-400">
          {categoryLabels[expense.category]}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-gray-900">{formatCurrency(expense.amount_cents)}</p>
        {myFamilySplit && (
          <p className="text-xs text-gray-400">
            Dein Anteil: {formatCurrency(myOwed)}
          </p>
        )}
        {!myFamilySplit && (
          <p className="text-xs text-gray-300">Nicht beteiligt</p>
        )}
      </div>

      {canEdit && expense.paid_by_family === myFamilyId && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
