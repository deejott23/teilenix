import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/formatting'
import type { FamilyBalance } from '@/types/app'
import { cn } from '@/lib/utils'

interface BalanceSummaryCardProps {
  balance: FamilyBalance
  totalSpentCents: number
}

export default function BalanceSummaryCard({ balance, totalSpentCents }: BalanceSummaryCardProps) {
  const isPositive = balance.netBalanceCents > 0
  const isNegative = balance.netBalanceCents < 0
  const isSettled = balance.netBalanceCents === 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dein Saldo</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'text-2xl font-bold',
                isPositive && 'text-primary',
                isNegative && 'text-red-500',
                isSettled && 'text-gray-400'
              )}
            >
              {isPositive ? '+' : ''}{formatCurrency(balance.netBalanceCents)}
            </span>
            {isPositive && <TrendingUp className="w-5 h-5 text-primary" />}
            {isNegative && <TrendingDown className="w-5 h-5 text-red-500" />}
            {isSettled && <Minus className="w-5 h-5 text-gray-400" />}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isPositive ? 'Du bekommst Geld zurück' : isNegative ? 'Du schuldest Geld' : 'Ausgeglichen'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Gesamt</p>
          <p className="font-semibold text-gray-800 text-sm">{formatCurrency(totalSpentCents)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Dein Anteil</p>
          <p className="font-semibold text-gray-800 text-sm">{formatCurrency(balance.totalOwedCents)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Du hast bezahlt</p>
          <p className="font-semibold text-gray-800 text-sm">{formatCurrency(balance.totalPaidCents)}</p>
        </div>
      </div>
    </div>
  )
}
