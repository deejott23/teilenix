import { formatCurrency } from '@/lib/formatting'
import type { SettlementBalance } from '@/types/app'
import { cn } from '@/lib/utils'

interface BalanceTableProps {
  balances: SettlementBalance[]
}

export default function BalanceTable({ balances }: BalanceTableProps) {
  return (
    <div className="bg-card card-shadow rounded-2xl overflow-hidden">
      <div className="grid grid-cols-4 bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <span className="col-span-1">Teilnehmer</span>
        <span className="text-right">Bezahlt</span>
        <span className="text-right">Anteil</span>
        <span className="text-right">Saldo</span>
      </div>

      {balances.map((balance, index) => {
        const isPositive = balance.netBalanceCents > 0
        const isNegative = balance.netBalanceCents < 0
        return (
          <div
            key={balance.participantId}
            className={cn(
              'grid grid-cols-4 px-4 py-3 text-sm',
              index % 2 === 0 ? 'bg-card' : 'bg-muted/40'
            )}
          >
            <span className="font-medium text-foreground truncate col-span-1 pr-2">
              {balance.participantName}
            </span>
            <span className="text-right text-muted-foreground">
              {formatCurrency(balance.totalPaidCents)}
            </span>
            <span className="text-right text-muted-foreground">
              {formatCurrency(balance.totalOwedCents)}
            </span>
            <span
              className={cn(
                'text-right font-semibold',
                isPositive && 'text-primary',
                isNegative && 'text-red-500',
                !isPositive && !isNegative && 'text-muted-foreground/50'
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
