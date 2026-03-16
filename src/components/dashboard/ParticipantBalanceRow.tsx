import { formatCurrency } from '@/lib/formatting'
import type { SettlementBalance } from '@/types/app'
import { cn } from '@/lib/utils'

interface ParticipantBalanceRowProps {
  balance: SettlementBalance
  isOwnParticipant: boolean
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-600',
  'bg-sky-100 text-sky-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-primary/10 text-primary',
]

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function ParticipantBalanceRow({ balance, isOwnParticipant }: ParticipantBalanceRowProps) {
  const isPositive = balance.netBalanceCents > 0
  const isNegative = balance.netBalanceCents < 0

  return (
    <div className={cn(
      'bg-card rounded-[18px] p-4 flex items-center gap-3 transition-shadow',
      isOwnParticipant ? 'card-shadow ring-1 ring-primary/20' : 'card-shadow'
    )}>
      {/* Avatar */}
      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-bold', getAvatarColor(balance.participantName))}>
        {balance.participantName.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-[14px] text-foreground truncate">{balance.participantName}</p>
          {isOwnParticipant && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide flex-shrink-0">du</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Bezahlt: {formatCurrency(balance.totalPaidCents)}</p>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0">
        <p className={cn(
          'font-bold text-[14px]',
          isPositive && 'text-emerald-600',
          isNegative && 'text-destructive',
          !isPositive && !isNegative && 'text-muted-foreground'
        )}>
          {isPositive ? '+' : ''}{formatCurrency(balance.netBalanceCents)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isPositive ? 'bekommt zurück' : isNegative ? 'schuldet' : 'ausgeglichen'}
        </p>
      </div>
    </div>
  )
}
