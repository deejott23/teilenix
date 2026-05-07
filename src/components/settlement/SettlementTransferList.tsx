import { formatCurrency } from '@/lib/formatting'
import { Icon } from '@/components/ui/icon'
import type { SettlementTransfer } from '@/types/app'

interface SettlementTransferListProps {
  transfers: SettlementTransfer[]
}

export default function SettlementTransferList({ transfers }: SettlementTransferListProps) {
  if (transfers.length === 0) {
    return (
      <div className="bg-primary/8 border border-primary/15 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-primary">Alles ausgeglichen!</p>
        <p className="text-sm text-primary/70">Keine Überweisungen notwendig.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer, index) => (
        <div
          key={index}
          className="bg-card card-shadow rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            {/* From participant */}
            <div className="flex-1 text-right">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center ml-auto mb-1">
                <span className="text-base font-bold text-red-500">
                  {transfer.fromParticipantName.charAt(0)}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground truncate">{transfer.fromParticipantName}</p>
            </div>

            {/* Arrow + amount */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="bg-primary/10 rounded-full px-3 py-1">
                <p className="text-sm font-bold text-primary">
                  {formatCurrency(transfer.amountCents)}
                </p>
              </div>
              <Icon name="settle" size={20} className="text-muted-foreground/40" />
            </div>

            {/* To participant */}
            <div className="flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-1">
                <span className="text-base font-bold text-primary">
                  {transfer.toParticipantName.charAt(0)}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground truncate">{transfer.toParticipantName}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
