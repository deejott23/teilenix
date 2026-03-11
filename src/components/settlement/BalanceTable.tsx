import { formatCurrency } from '@/lib/formatting'
import type { FamilyBalance } from '@/types/app'
import { cn } from '@/lib/utils'

interface BalanceTableProps {
  balances: FamilyBalance[]
}

export default function BalanceTable({ balances }: BalanceTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-4 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <span className="col-span-1">Familie</span>
        <span className="text-right">Bezahlt</span>
        <span className="text-right">Anteil</span>
        <span className="text-right">Saldo</span>
      </div>

      {balances.map((balance, index) => {
        const isPositive = balance.netBalanceCents > 0
        const isNegative = balance.netBalanceCents < 0
        return (
          <div
            key={balance.familyId}
            className={cn(
              'grid grid-cols-4 px-4 py-3 text-sm',
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
            )}
          >
            <span className="font-medium text-gray-800 truncate col-span-1 pr-2">
              {balance.familyName}
            </span>
            <span className="text-right text-gray-600">
              {formatCurrency(balance.totalPaidCents)}
            </span>
            <span className="text-right text-gray-600">
              {formatCurrency(balance.totalOwedCents)}
            </span>
            <span
              className={cn(
                'text-right font-semibold',
                isPositive && 'text-primary',
                isNegative && 'text-red-500',
                !isPositive && !isNegative && 'text-gray-400'
              )}
            >
              {isPositive ? '+' : ''}{formatCurrency(balance.netBalanceCents)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
