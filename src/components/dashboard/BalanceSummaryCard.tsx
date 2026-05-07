import { formatCurrency } from '@/lib/formatting'
import type { SettlementBalance } from '@/types/app'

interface BalanceSummaryCardProps {
  balance: SettlementBalance
  totalSpentCents: number
}

export default function BalanceSummaryCard({ balance, totalSpentCents }: BalanceSummaryCardProps) {
  const isPositive = balance.netBalanceCents > 0
  const isNegative = balance.netBalanceCents < 0

  const gradient = isPositive
    ? 'from-[#1E6FD9] to-[#1558b0]'
    : isNegative
    ? 'from-[#1e3fa8] to-[#152d80]'
    : 'from-[#6b7280] to-[#4b5563]'

  const statusText = isPositive
    ? 'Du bekommst Geld zurück'
    : isNegative
    ? 'Du schuldest noch Geld'
    : 'Alles ausgeglichen'

  const statusEmoji = isPositive ? '🎉' : isNegative ? '💳' : '✅'

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-[18px] p-5 text-white overflow-hidden relative`}>
      {/* Subtle circle decoration */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-3">Dein Saldo</p>

        <p className="text-4xl font-bold tracking-tight mb-1">
          {isPositive ? '+' : ''}{formatCurrency(balance.netBalanceCents)}
        </p>
        <p className="text-sm text-white/70 mb-5">{statusEmoji} {statusText}</p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Gesamt',      value: totalSpentCents },
            { label: 'Dein Anteil', value: balance.totalOwedCents },
            { label: 'Du bezahlt',  value: balance.totalPaidCents },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-white/55 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-sm font-bold text-white">{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
