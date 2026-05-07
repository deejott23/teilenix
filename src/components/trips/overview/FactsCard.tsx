import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatting'

export default async function FactsCard({ tripId }: { tripId: string }) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: expensesRaw }, { data: activitiesRaw }, { data: activityVotesRaw }] = await Promise.all([
    db.from('expenses').select('amount_cents, paid_by_participant_id, category').eq('trip_id', tripId),
    db.from('trip_activities').select('id, created_by_participant_id').eq('trip_id', tripId),
    db.from('trip_activity_votes').select('activity_id, participant_id, vote').eq('trip_id', tripId),
  ])

  type Expense = { amount_cents: number; paid_by_participant_id: string; category: string }
  const expenses = ((expensesRaw ?? []) as Expense[]).filter(e => e.category !== 'payment')
  const totalCents = expenses.reduce((s: number, e: Expense) => s + e.amount_cents, 0)

  type Activity = { id: string; created_by_participant_id: string }
  const activities = (activitiesRaw ?? []) as Activity[]

  type AVote = { activity_id: string; participant_id: string; vote: string }
  const activityVotes = (activityVotesRaw ?? []) as AVote[]

  if (totalCents === 0 && activities.length === 0) return null

  // Top payer
  const paidByPerson = new Map<string, number>()
  for (const e of expenses) paidByPerson.set(e.paid_by_participant_id, (paidByPerson.get(e.paid_by_participant_id) ?? 0) + e.amount_cents)
  const topPayerId = [...paidByPerson.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  // Top proposer
  const proposalsByPerson = new Map<string, number>()
  for (const a of activities) proposalsByPerson.set(a.created_by_participant_id, (proposalsByPerson.get(a.created_by_participant_id) ?? 0) + 1)
  const topProposerId = [...proposalsByPerson.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  // Fetch names
  const participantIds = [...new Set([topPayerId, topProposerId].filter(Boolean) as string[])]
  let nameMap = new Map<string, string>()
  if (participantIds.length > 0) {
    const { data: pRaw } = await supabase.from('trip_participants').select('id, name').in('id', participantIds)
    nameMap = new Map(((pRaw ?? []) as { id: string; name: string }[]).map(p => [p.id, p.name]))
  }

  const topPayerName = topPayerId ? nameMap.get(topPayerId) : null
  const topProposerName = topProposerId ? nameMap.get(topProposerId) : null
  const totalVotes = activityVotes.length

  // Build teaser headline
  let headline = ''
  if (topPayerName && totalCents > 0) {
    headline = `${topPayerName} zahlte am meisten`
    if (topProposerName && topProposerName !== topPayerName) {
      headline += ` · ${topProposerName} schlug am meisten vor`
    }
  } else if (activities.length > 0) {
    headline = `${activities.length} Ideen eingereicht · ${totalVotes} Votes abgegeben`
  }

  const pills: string[] = []
  if (totalCents > 0) pills.push(`💸 ${formatCurrency(totalCents)} ausgegeben`)
  if (activities.length > 0) pills.push(`💡 ${activities.length} Ideen`)
  if (totalVotes > 0) pills.push(`🗳️ ${totalVotes} Votes`)

  return (
    <Link href={`/trips/${tripId}/facts`} className="block active:scale-[0.98] transition-transform">
      <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
        {/* Masthead strip */}
        <div className="bg-foreground px-4 py-2 flex items-center justify-between">
          <span className="text-[15px] font-black tracking-tight text-background font-serif">
            Reise<span className="text-amber-400">Blatt</span>
          </span>
          <span className="text-[10px] font-black bg-amber-400 text-black px-2 py-0.5 rounded">
            Neueste Headlines
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {headline && (
            <p className="text-[14px] font-black text-foreground font-serif leading-snug mb-2.5">{headline}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {pills.map((p, i) => (
              <span key={i} className="bg-muted text-muted-foreground text-[11px] font-bold px-2.5 py-1 rounded-full">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--section-facts)' }}>
          Alle Schlagzeilen lesen
          <span className="text-[14px]">→</span>
        </div>
      </div>
    </Link>
  )
}

export function FactsCardSkeleton() {
  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      <div className="h-9 bg-muted animate-pulse" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  )
}
