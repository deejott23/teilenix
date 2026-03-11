'use client'

import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/formatting'
import type { SettlementResult } from '@/types/app'

interface SettlementExportButtonProps {
  tripName: string
  settlement: SettlementResult
}

export default function SettlementExportButton({ tripName, settlement }: SettlementExportButtonProps) {
  const [generating, setGenerating] = useState(false)

  const shareText = () => {
    const lines = [
      `🧾 Abrechnung: ${tripName}`,
      `💰 Gesamt: ${formatCurrency(settlement.totalSpentCents)}`,
      '',
      settlement.transfers.length === 0
        ? '✅ Alles ausgeglichen!'
        : settlement.transfers.map(t =>
            `${t.fromFamilyName} → ${t.toFamilyName}: ${formatCurrency(t.amountCents)}`
          ).join('\n'),
    ]
    return lines.join('\n')
  }

  const handleShare = async () => {
    const text = shareText()
    if (navigator.share) {
      try {
        await navigator.share({ title: `TeileniX – ${tripName}`, text })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Abrechnung in die Zwischenablage kopiert!')
    }
  }

  const handleDownloadText = () => {
    setGenerating(true)
    try {
      const text = [
        `ABRECHNUNG: ${tripName}`,
        '='.repeat(40),
        `Gesamt ausgegeben: ${formatCurrency(settlement.totalSpentCents)}`,
        '',
        'ÜBERWEISUNGEN:',
        '-'.repeat(40),
        settlement.transfers.length === 0
          ? 'Keine Überweisungen notwendig – alles ausgeglichen!'
          : settlement.transfers.map(t =>
              `${t.fromFamilyName.padEnd(20)} zahlt ${formatCurrency(t.amountCents).padStart(10)} an ${t.toFamilyName}`
            ).join('\n'),
        '',
        'DETAILÜBERSICHT:',
        '-'.repeat(40),
        ['Familie', 'Bezahlt', 'Anteil', 'Saldo']
          .map(h => h.padEnd(18)).join(''),
        ...settlement.balances.map(b => [
          b.familyName.padEnd(18),
          formatCurrency(b.totalPaidCents).padEnd(18),
          formatCurrency(b.totalOwedCents).padEnd(18),
          `${b.netBalanceCents > 0 ? '+' : ''}${formatCurrency(b.netBalanceCents)}`,
        ].join('')),
        '',
        `Erstellt mit TeileniX`,
      ].join('\n')

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Abrechnung_${tripName.replace(/\s+/g, '_')}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Abrechnung heruntergeladen!')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="flex-1 gap-2"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4" />
        Teilen
      </Button>
      <Button
        variant="outline"
        className="flex-1 gap-2"
        onClick={handleDownloadText}
        disabled={generating}
      >
        <Download className="w-4 h-4" />
        Herunterladen
      </Button>
    </div>
  )
}
