import { ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/formatting'
import type { SettlementTransfer } from '@/types/app'

interface SettlementTransferListProps {
  transfers: SettlementTransfer[]
}

export default function SettlementTransferList({ transfers }: SettlementTransferListProps) {
  if (transfers.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-800">Alles ausgeglichen!</p>
        <p className="text-sm text-green-600">Keine Überweisungen notwendig.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer, index) => (
        <div
          key={index}
          className="bg-white border border-gray-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            {/* From family */}
            <div className="flex-1 text-right">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center ml-auto mb-1">
                <span className="text-base font-bold text-red-500">
                  {transfer.fromFamilyName.charAt(0)}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 truncate">{transfer.fromFamilyName}</p>
            </div>

            {/* Arrow + amount */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="bg-primary/10 rounded-full px-3 py-1">
                <p className="text-sm font-bold text-primary">
                  {formatCurrency(transfer.amountCents)}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* To family */}
            <div className="flex-1">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-1">
                <span className="text-base font-bold text-primary">
                  {transfer.toFamilyName.charAt(0)}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 truncate">{transfer.toFamilyName}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
