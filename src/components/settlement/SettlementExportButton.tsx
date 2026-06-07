'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import type { Settlement, ExpenseWithSplits, TripParticipant, ExpenseCategory } from '@/types/app'

interface SettlementExportButtonProps {
  tripName: string
  settlement: Settlement
  expenses: ExpenseWithSplits[]
  participants: TripParticipant[]
}

export default function SettlementExportButton({ tripName, settlement, expenses, participants }: SettlementExportButtonProps) {
  const [generating, setGenerating] = useState(false)

  const shareText = () => {
    const lines = [
      `🧾 Abrechnung: ${tripName}`,
      `💰 Gesamt: ${formatCurrency(settlement.totalSpentCents)}`,
      '',
      settlement.transfers.length === 0
        ? '✅ Alles ausgeglichen!'
        : settlement.transfers.map(t =>
            `${t.fromParticipantName} → ${t.toParticipantName}: ${formatCurrency(t.amountCents)}`
          ).join('\n'),
    ]
    return lines.join('\n')
  }

  const handleShare = async () => {
    const text = shareText()
    if (navigator.share) {
      try {
        await navigator.share({ title: `share|pa – ${tripName}`, text })
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
              `${t.fromParticipantName.padEnd(20)} zahlt ${formatCurrency(t.amountCents).padStart(10)} an ${t.toParticipantName}`
            ).join('\n'),
        '',
        'DETAILÜBERSICHT:',
        '-'.repeat(40),
        ['Teilnehmer', 'Bezahlt', 'Anteil', 'Saldo']
          .map(h => h.padEnd(18)).join(''),
        ...settlement.balances.map(b => [
          b.participantName.padEnd(18),
          formatCurrency(b.totalPaidCents).padEnd(18),
          formatCurrency(b.totalOwedCents).padEnd(18),
          `${b.netBalanceCents > 0 ? '+' : ''}${formatCurrency(b.netBalanceCents)}`,
        ].join('')),
        '',
        `Erstellt mit share|pa`,
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

  const handleDownloadCsv = () => {
    // Billable participants: groups + standalone (not group members), sorted by name
    const pMap = new Map(participants.map(p => [p.id, p]))
    const billable = participants
      .filter(p => !p.group_id)
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))

    const centsToEuro = (cents: number) =>
      (cents / 100).toFixed(2).replace('.', ',')

    // Header row
    const headers = [
      'Datum', 'Titel', 'Kategorie', 'Bezahlt von', 'Gesamt (EUR)',
      ...billable.map(p => p.name),
    ]
    const rows: string[][] = [headers]

    // Expenses sorted by date, payments excluded
    const sorted = expenses
      .filter(e => e.category !== 'payment')
      .sort((a, b) => a.expense_date.localeCompare(b.expense_date))

    for (const expense of sorted) {
      const payerP = pMap.get(expense.paid_by_participant_id)
      const payerBillableId = payerP?.group_id ?? payerP?.id ?? ''
      const payerBillable = pMap.get(payerBillableId)
      let payerLabel = payerBillable?.name ?? payerP?.name ?? 'Unbekannt'

      // Add co-payer names if present
      const coPayers = expense.co_payers ?? []
      if (coPayers.length > 0) {
        const coNames = coPayers.map(cp => {
          const cpP = pMap.get(cp.participant_id)
          const cpBillable = pMap.get(cpP?.group_id ?? cpP?.id ?? '')
          return cpBillable?.name ?? cpP?.name ?? '?'
        }).join(', ')
        payerLabel += ` + ${coNames}`
      }

      const catLabel = categoryLabels[expense.category as ExpenseCategory] ?? expense.category

      // Aggregate shares per billable participant
      const totalShares = expense.expense_splits.reduce((s, sp) => s + sp.shares, 0)
      const billableShares = new Map<string, number>()
      for (const split of expense.expense_splits) {
        const sp = pMap.get(split.participant_id)
        const bId = sp?.group_id ?? sp?.id ?? split.participant_id
        billableShares.set(bId, (billableShares.get(bId) ?? 0) + split.shares)
      }

      // Calculate per-billable amounts with rounding correction on last
      const billableWithShares = billable.filter(b => billableShares.has(b.id))
      const amountPerBillable = new Map<string, number>()
      let distributed = 0
      billableWithShares.forEach((b, idx) => {
        const shares = billableShares.get(b.id) ?? 0
        let amount: number
        if (idx === billableWithShares.length - 1) {
          amount = expense.amount_cents - distributed
        } else {
          amount = totalShares > 0 ? Math.round(expense.amount_cents * shares / totalShares) : 0
        }
        distributed += amount
        amountPerBillable.set(b.id, amount)
      })

      rows.push([
        expense.expense_date,
        expense.title,
        catLabel,
        payerLabel,
        centsToEuro(expense.amount_cents),
        ...billable.map(b => {
          const amount = amountPerBillable.get(b.id)
          return amount !== undefined ? centsToEuro(amount) : ''
        }),
      ])
    }

    // Totals row using settlement balances
    const totalExpenses = sorted.reduce((s, e) => s + e.amount_cents, 0)
    const balanceMap = new Map(settlement.balances.map(b => [b.participantId, b]))
    rows.push([
      '', 'GESAMT', '', '',
      centsToEuro(totalExpenses),
      ...billable.map(b => {
        const bal = balanceMap.get(b.id)
        return bal ? centsToEuro(bal.totalOwedCents) : ''
      }),
    ])

    // Serialize to semicolon-separated CSV with BOM for Excel
    const escape = (cell: string) => {
      if (cell.includes(';') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }
    const csv = rows.map(r => r.map(escape).join(';')).join('\r\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Ausgaben_${tripName.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV heruntergeladen – direkt in Excel öffnen!')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleShare}
        >
          <Icon name="share" size={16} />
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
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleDownloadCsv}
      >
        <Download className="w-4 h-4" />
        Ausgaben als Excel/CSV exportieren
      </Button>
    </div>
  )
}
