import type { ExpenseWithSplits, TripParticipant, SettlementBalance, SettlementTransfer, Settlement } from '@/types/app'

/**
 * Computes settlement balances and minimum-transfer plan.
 * Pure function – no database dependencies.
 */
export function computeSettlement(
  expenses: ExpenseWithSplits[],
  participants: TripParticipant[]
): Settlement {
  // Build lookup to resolve group members → their group
  const participantLookup = new Map(participants.map(p => [p.id, p]))

  // Only billable entities (groups + standalone individuals, NOT group members)
  const billable = participants.filter(p => !p.group_id)
  const balanceMap = new Map<string, SettlementBalance>()
  billable.forEach(p => {
    balanceMap.set(p.id, {
      participantId: p.id,
      participantName: p.name,
      totalPaidCents: 0,
      totalOwedCents: 0,
      netBalanceCents: 0,
    })
  })

  let totalSpentCents = 0

  expenses.forEach(expense => {
    totalSpentCents += expense.amount_cents

    // Resolve payer to their group if they belong to one
    const payerParticipant = participantLookup.get(expense.paid_by_participant_id)
    const billablePayerId = payerParticipant?.group_id ?? expense.paid_by_participant_id
    const payer = balanceMap.get(billablePayerId)
    if (payer) {
      payer.totalPaidCents += expense.amount_cents
    }

    // Distribute owed amounts among participating splits
    const totalShares = expense.expense_splits.reduce((sum, s) => sum + s.shares, 0)
    if (totalShares === 0) return

    let distributed = 0
    expense.expense_splits.forEach((split, index) => {
      const participant = balanceMap.get(split.participant_id)
      if (!participant) return

      let owed: number
      if (index === expense.expense_splits.length - 1) {
        // Last split gets the remainder to avoid rounding drift
        owed = expense.amount_cents - distributed
      } else {
        owed = Math.round(expense.amount_cents * split.shares / totalShares)
      }
      distributed += owed
      participant.totalOwedCents += owed
    })
  })

  // Compute net balance
  balanceMap.forEach(b => {
    b.netBalanceCents = b.totalPaidCents - b.totalOwedCents
  })

  // Compute minimum transfers using greedy algorithm
  const creditors = [...balanceMap.values()]
    .filter(b => b.netBalanceCents > 0)
    .sort((a, b) => b.netBalanceCents - a.netBalanceCents)

  const debtors = [...balanceMap.values()]
    .filter(b => b.netBalanceCents < 0)
    .sort((a, b) => a.netBalanceCents - b.netBalanceCents) // most negative first

  // Work on mutable copies
  const creditorQueue = creditors.map(c => ({ ...c }))
  const debtorQueue = debtors.map(d => ({ ...d }))

  const transfers: SettlementTransfer[] = []
  let ci = 0
  let di = 0

  while (ci < creditorQueue.length && di < debtorQueue.length) {
    const creditor = creditorQueue[ci]
    const debtor = debtorQueue[di]
    const amount = Math.min(creditor.netBalanceCents, Math.abs(debtor.netBalanceCents))

    if (amount > 0) {
      transfers.push({
        fromParticipantId: debtor.participantId,
        fromParticipantName: debtor.participantName,
        toParticipantId: creditor.participantId,
        toParticipantName: creditor.participantName,
        amountCents: amount,
      })
    }

    creditor.netBalanceCents -= amount
    debtor.netBalanceCents += amount

    if (creditor.netBalanceCents === 0) ci++
    if (debtor.netBalanceCents === 0) di++
  }

  return {
    balances: [...balanceMap.values()],
    transfers,
    totalSpentCents,
  }
}
