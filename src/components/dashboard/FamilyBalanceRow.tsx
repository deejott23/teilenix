import { formatCurrency } from '@/lib/formatting'
import type { FamilyBalance } from '@/types/app'
import { cn } from '@/lib/utils'

interface FamilyBalanceRowProps {
  balance: FamilyBalance
  isOwnFamily: boolean
}

export default function FamilyBalanceRow({ balance, isOwnFamily }: FamilyBalanceRowProps) {
  const isPositive = balance.netBalanceCents > 0
  const isNegative = balance.netBalanceCents < 0

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 flex items-center gap-3',
        isOwnFamily ? 'border-primary/30' : 'border-gray-100'
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-100 flex items-center justify-center flex-shrink-0">
        <span className="text-base font-bold text-primary">
          {balance.familyName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-gray-900 text-sm', isOwnFamily && 'text-primary')}>
          {balance.familyName}
          {isOwnFamily && <span className="ml-1.5 text-xs text-gray-400">(du)</span>}
        </p>
        <p className="text-xs text-gray-400">
          Bezahlt: {formatCurrency(balance.totalPaidCents)}
        </p>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            'font-semibold text-sm',
            isPositive && 'text-primary',
            isNegative && 'text-red-500',
            !isPositive && !isNegative && 'text-gray-400'
          )}
        >
          {isPositive ? '+' : ''}{formatCurrency(balance.netBalanceCents)}
        </p>
        <p className="text-xs text-gray-400">
          {isPositive ? 'bekommt zurück' : isNegative ? 'schuldet' : 'ausgeglichen'}
        </p>
      </div>
    </div>
  )
}
