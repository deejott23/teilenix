'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@/lib/formatting'
import type { TripParticipant, ExpenseWithSplits } from '@/types/app'

interface GroupBreakdown {
  group: TripParticipant
  members: Array<{
    participant: TripParticipant
    totalPaidCents: number
  }>
}

interface GroupMemberBreakdownProps {
  breakdowns: GroupBreakdown[]
}

function GroupCard({ breakdown }: { breakdown: GroupBreakdown }) {
  const [open, setOpen] = useState(false)
  const total = breakdown.members.reduce((s, m) => s + m.totalPaidCents, 0)
  const hasPaid = total > 0

  return (
    <div className="bg-card card-shadow rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">👥 {breakdown.group.name}</span>
          {!hasPaid && (
            <span className="text-xs text-muted-foreground/50">keine Zahlungen erfasst</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasPaid && (
            <span className="text-sm font-bold text-foreground">{formatCurrency(total)} bezahlt</span>
          )}
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {breakdown.members.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Keine Mitglieder erfasst.</p>
          ) : (
            breakdown.members.map((m, i) => (
              <div
                key={m.participant.id}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}
              >
                <span className="text-foreground font-medium">{m.participant.name}</span>
                <span className={m.totalPaidCents > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground/50'}>
                  {m.totalPaidCents > 0 ? formatCurrency(m.totalPaidCents) : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function computeGroupBreakdowns(
  expenses: ExpenseWithSplits[],
  participants: TripParticipant[]
): GroupBreakdown[] {
  const participantMap = new Map(participants.map(p => [p.id, p]))
  const groups = participants.filter(p => p.is_group)

  return groups.map(group => {
    const members = participants.filter(p => p.group_id === group.id)

    const memberTotals = new Map<string, number>()
    members.forEach(m => memberTotals.set(m.id, 0))

    expenses.forEach(e => {
      const payer = participantMap.get(e.paid_by_participant_id)
      if (payer?.group_id === group.id) {
        memberTotals.set(payer.id, (memberTotals.get(payer.id) ?? 0) + e.amount_cents)
      }
    })

    return {
      group,
      members: members.map(m => ({
        participant: m,
        totalPaidCents: memberTotals.get(m.id) ?? 0,
      })),
    }
  })
}

export default function GroupMemberBreakdown({ breakdowns }: GroupMemberBreakdownProps) {
  if (breakdowns.length === 0) return null

  return (
    <div className="space-y-3">
      {breakdowns.map(b => (
        <GroupCard key={b.group.id} breakdown={b} />
      ))}
    </div>
  )
}
