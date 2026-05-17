import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/user'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatCurrency, categoryLabels } from '@/lib/formatting'
import { activityTypeEmoji } from '@/lib/activities'
import type { TripParticipant, ActivityType } from '@/types/app'

// ── helpers ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#f87171','#fb923c','#facc15','#4ade80','#60a5fa','#a78bfa','#f472b6']
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}
function avatarColor(id: string) { return AVATAR_COLORS[hashId(id) % AVATAR_COLORS.length] }
function initials(name: string) { return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) }

function Avatar({ id, name, size = 28 }: { id: string; name: string; size?: number }) {
  return (
    <span
      style={{ background: avatarColor(id), width: size, height: size, fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
    >
      {initials(name)}
    </span>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function Masthead({ tripName }: { tripName: string }) {
  return (
    <div className="bg-foreground text-background text-center py-3 px-4">
      <div className="text-[9px] font-bold tracking-[3px] uppercase opacity-50 mb-1">{tripName}</div>
      <div className="text-[26px] font-black tracking-tight leading-none font-serif">
        Reise<span className="text-amber-400">Blatt</span>
      </div>
      <div className="text-[10px] opacity-40 mt-1 italic border-t border-white/10 pt-1.5">
        „Alles was ihr wissen müsst — ob ihr wollt oder nicht"
      </div>
    </div>
  )
}

function BreakingStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="bg-amber-400 px-4 py-1.5 flex gap-3 overflow-x-auto scrollbar-none">
      {items.map((item, i) => (
        <span key={i} className="text-[11px] font-black text-black whitespace-nowrap">{item}</span>
      ))}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-foreground">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function LeadArticle({ category, headline, deck, emoji, tag }: {
  category: string; headline: string; deck: string; emoji: string; tag?: string
}) {
  return (
    <div className="mx-4 mb-3 bg-card rounded-[18px] card-shadow border-2 border-foreground/10 p-4 relative overflow-hidden">
      <div className="flex items-start gap-0">
        <div className="flex-1">
          <div className="text-[9px] font-black tracking-[2px] uppercase text-amber-600 mb-1.5 flex items-center gap-1">
            {category}
          </div>
          <h2 className="text-[17px] font-black text-foreground leading-[1.15] font-serif mb-2">{headline}</h2>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{deck}</p>
          {tag && (
            <span className="inline-block bg-foreground text-background text-[9px] font-black px-2 py-0.5 rounded">{tag}</span>
          )}
        </div>
        <div className="text-[52px] leading-none ml-3 flex-shrink-0 -mt-1">{emoji}</div>
      </div>
    </div>
  )
}

function GridArticle({ category, headline, deck, emoji, tag }: {
  category: string; headline: string; deck: string; emoji: string; tag?: string
}) {
  return (
    <div className="bg-card rounded-[16px] card-shadow border border-border p-3">
      <div className="text-[28px] float-right ml-2 mb-1 leading-none">{emoji}</div>
      <div className="text-[8px] font-black tracking-[2px] uppercase text-amber-600 mb-1">{category}</div>
      <div className="text-[13px] font-black text-foreground leading-snug font-serif mb-1.5 clear-none">{headline}</div>
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 clear-both mb-2">{deck}</p>
      {tag && <span className="inline-block bg-foreground/10 text-foreground text-[9px] font-black px-2 py-0.5 rounded">{tag}</span>}
    </div>
  )
}

function RankingArticle({ title, rows }: {
  title: string
  rows: { name: string; participantId: string; value: string; detail?: string; pct: number }[]
}) {
  if (rows.length === 0) return null
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="mx-4 mb-3 bg-foreground rounded-[18px] p-4">
      <div className="text-[9px] font-black tracking-[2px] uppercase text-amber-400 mb-2">Rangliste</div>
      <h3 className="text-[15px] font-black text-background font-serif mb-3">{title}</h3>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={row.participantId + i} className="flex items-center gap-2.5">
            <span className="text-[15px] w-6">{medals[i] ?? `${i + 1}.`}</span>
            <Avatar id={row.participantId} name={row.name} size={28} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[12px] font-bold text-background truncate">{row.name}</span>
                <span className="text-[12px] font-black text-amber-400 flex-shrink-0">{row.value}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${row.pct}%` }} />
              </div>
              {row.detail && <div className="text-[10px] text-white/40 mt-0.5">{row.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuoteBox({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="mx-4 mb-3 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[18px] p-4">
      <div className="text-[16px] font-black text-white font-serif leading-snug mb-2">
        „{text}"
      </div>
      <div className="text-[11px] text-white/60">{sub}</div>
    </div>
  )
}

function WideArticle({ icon, category, headline, deck, tag }: {
  icon: string; category: string; headline: string; deck: string; tag?: string
}) {
  return (
    <div className="mx-4 mb-3 bg-card rounded-[16px] card-shadow border border-border p-4 flex gap-3 items-start">
      <div className="text-[36px] flex-shrink-0 leading-none">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] font-black tracking-[2px] uppercase text-amber-600 mb-1">{category}</div>
        <div className="text-[14px] font-black text-foreground font-serif leading-snug mb-1.5">{headline}</div>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">{deck}</p>
        {tag && <span className="inline-block bg-foreground/8 border border-border text-[9px] font-black px-2 py-0.5 rounded text-muted-foreground">{tag}</span>}
      </div>
    </div>
  )
}

function StatStrip({ stats }: { stats: { emoji: string; value: string; label: string }[] }) {
  return (
    <div className="px-4 mb-3">
      <div className="bg-card rounded-[16px] card-shadow border border-border flex divide-x divide-border">
        {stats.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center py-3 px-1">
            <div className="text-[18px] leading-none mb-1">{s.emoji}</div>
            <div className="text-[15px] font-black text-foreground">{s.value}</div>
            <div className="text-[9px] font-bold text-muted-foreground mt-0.5 text-center leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CtaBanner({ tripId }: { tripId: string }) {
  return (
    <div className="mx-4 mb-3 bg-amber-400 rounded-[16px] p-4 flex items-center gap-3">
      <div className="text-[28px]">✍️</div>
      <div className="flex-1">
        <div className="text-[13px] font-black text-black">Mehr Schlagzeilen? Mehr Ideen!</div>
        <div className="text-[11px] text-black/70 mt-0.5">Vorschläge machen = mehr Facts für alle</div>
      </div>
      <Link href={`/trips/${tripId}/planen`} className="text-black/60">
        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
      </Link>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────────

export default async function FactsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    { data: trip },
    { data: participantsRaw },
    { data: expensesRaw },
    { data: activitiesRaw },
    { data: activityVotesRaw },
    { data: mealIdeasRaw },
    { data: mealVotesRaw },
    { data: packlistRaw },
    { data: activityCommentsRaw },
  ] = await Promise.all([
    supabase.from('trips').select('name, status, start_date, end_date').eq('id', tripId).single(),
    supabase.from('trip_participants').select('id, name, user_id, is_group, group_id').eq('trip_id', tripId),
    db.from('expenses').select('id, amount_cents, paid_by_participant_id, category').eq('trip_id', tripId),
    db.from('trip_activities').select('id, title, activity_type, cover_emoji, created_by_participant_id').eq('trip_id', tripId),
    db.from('trip_activity_votes').select('activity_id, participant_id, vote').eq('trip_id', tripId),
    db.from('trip_meal_ideas').select('id, title, emoji, created_by_participant_id').eq('trip_id', tripId),
    db.from('trip_meal_votes').select('meal_idea_id, participant_id').eq('trip_id', tripId),
    (supabase as any).from('packlist_items').select('id, packlist_checks(item_id)').eq('trip_id', tripId),
    db.from('trip_activity_comments').select('participant_id').eq('trip_id', tripId),
  ])

  // Guard: ReiseBlatt nur ab Tag 3 einer aktiven Reise
  if (trip?.status === 'active') {
    const startDate = (trip as unknown as { start_date: string | null }).start_date
    if (!startDate) redirect(`/trips/${tripId}`)
    const start = new Date(startDate + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / 86_400_000)
    if (daysSinceStart < 2) redirect(`/trips/${tripId}`)
  }

  const allParticipants = (participantsRaw ?? []) as TripParticipant[]
  // Full map for name lookups (expenses can be paid by group-members or guests)
  const participantMap = new Map(allParticipants.map(p => [p.id, p]))
  // Only real individuals for proposal/vote rankings
  const participants = allParticipants.filter(p => !p.is_group && !p.group_id)

  // ── Expenses ────────────────────────────────────────────────────────────────
  type Expense = { id: string; amount_cents: number; paid_by_participant_id: string; category: string }
  const expenses = ((expensesRaw ?? []) as Expense[]).filter(e => e.category !== 'payment')
  const totalCents = expenses.reduce((s, e) => s + e.amount_cents, 0)

  const paidByPerson = new Map<string, number>()
  for (const e of expenses) {
    paidByPerson.set(e.paid_by_participant_id, (paidByPerson.get(e.paid_by_participant_id) ?? 0) + e.amount_cents)
  }
  const paidRanking = [...paidByPerson.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, cents]) => ({ id, cents, name: participantMap.get(id)?.name ?? 'Unbekannt' }))

  const categoryTotals = new Map<string, number>()
  for (const e of expenses) categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount_cents)
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]

  // ── Activities ──────────────────────────────────────────────────────────────
  type Activity = { id: string; title: string; activity_type: ActivityType; cover_emoji: string | null; created_by_participant_id: string }
  const activities = (activitiesRaw ?? []) as Activity[]
  type ActivityVote = { activity_id: string; participant_id: string; vote: string }
  const activityVotes = (activityVotesRaw ?? []) as ActivityVote[]

  // votes per activity
  const activityYesCounts = new Map<string, number>()
  for (const v of activityVotes) {
    if (v.vote === 'yes') activityYesCounts.set(v.activity_id, (activityYesCounts.get(v.activity_id) ?? 0) + 1)
  }
  const topActivity = activities
    .map(a => ({ ...a, yes: activityYesCounts.get(a.id) ?? 0 }))
    .sort((a, b) => b.yes - a.yes)[0]

  // proposals per person
  const proposalsByPerson = new Map<string, number>()
  for (const a of activities) proposalsByPerson.set(a.created_by_participant_id, (proposalsByPerson.get(a.created_by_participant_id) ?? 0) + 1)
  const topProposer = [...proposalsByPerson.entries()].sort((a, b) => b[1] - a[1])[0]

  // votes per person
  const votesByPerson = new Map<string, number>()
  for (const v of activityVotes) votesByPerson.set(v.participant_id, (votesByPerson.get(v.participant_id) ?? 0) + 1)

  // comments per person
  type CommentRow = { participant_id: string }
  const activityComments = (activityCommentsRaw ?? []) as CommentRow[]
  const commentsByPerson = new Map<string, number>()
  for (const c of activityComments) commentsByPerson.set(c.participant_id, (commentsByPerson.get(c.participant_id) ?? 0) + 1)

  // ── Meals ───────────────────────────────────────────────────────────────────
  type MealIdea = { id: string; title: string; emoji: string; created_by_participant_id: string }
  const mealIdeas = (mealIdeasRaw ?? []) as MealIdea[]
  type MealVote = { meal_idea_id: string; participant_id: string }
  const mealVotes = (mealVotesRaw ?? []) as MealVote[]

  const mealVoteCounts = new Map<string, number>()
  for (const v of mealVotes) mealVoteCounts.set(v.meal_idea_id, (mealVoteCounts.get(v.meal_idea_id) ?? 0) + 1)
  const topMeal = mealIdeas.map(m => ({ ...m, votes: mealVoteCounts.get(m.id) ?? 0 })).sort((a, b) => b.votes - a.votes)[0]

  // ── Packlist ────────────────────────────────────────────────────────────────
  // packlist_checks are embedded — no second round-trip
  const packlistTotal = (packlistRaw ?? []).length
  const packlistChecked = new Set(
    (packlistRaw ?? []).flatMap((i: any) => (i.packlist_checks ?? []).map((c: any) => c.item_id))
  ).size
  const packlistPct = packlistTotal > 0 ? Math.round((packlistChecked / packlistTotal) * 100) : 0

  // ── Compound stats ──────────────────────────────────────────────────────────
  const totalVotes = activityVotes.length + mealVotes.length
  const totalIdeas = activities.length + mealIdeas.length
  const totalExpenseCount = expenses.length

  // ── Build paid ranking rows ─────────────────────────────────────────────────
  const maxPaid = paidRanking[0]?.cents ?? 1
  const paidRows = paidRanking.slice(0, 4).map(r => ({
    name: r.name,
    participantId: r.id,
    value: formatCurrency(r.cents),
    detail: totalCents > 0 ? `${Math.round((r.cents / totalCents) * 100)}% der Gesamtkosten` : undefined,
    pct: Math.round((r.cents / maxPaid) * 100),
  }))

  // ── Proposal ranking ────────────────────────────────────────────────────────
  const maxProposals = [...proposalsByPerson.values()].reduce((a, b) => Math.max(a, b), 1)
  const proposalRows = [...proposalsByPerson.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      name: participantMap.get(id)?.name ?? 'Unbekannt',
      participantId: id,
      value: `${count} Ideen`,
      pct: Math.round((count / maxProposals) * 100),
    }))

  // ── Headline generation ─────────────────────────────────────────────────────
  const biggestPayerName = paidRanking[0]?.name
  const biggestPayerCents = paidRanking[0]?.cents ?? 0
  const secondPayerCents = paidRanking[1]?.cents ?? 0
  const payerFactor = secondPayerCents > 0 ? (biggestPayerCents / secondPayerCents).toFixed(1) : null

  const breakingItems: string[] = []
  if (totalCents > 0) breakingItems.push(`💸 ${formatCurrency(totalCents)} ausgegeben`)
  if (topActivity) breakingItems.push(`⭐ Favorit: ${topActivity.title}`)
  if (biggestPayerName) breakingItems.push(`👑 Zahler Nr. 1: ${biggestPayerName}`)
  if (totalIdeas > 0) breakingItems.push(`💡 ${totalIdeas} Ideen eingereicht`)

  const tripName = (trip?.name as string) ?? 'Eure Reise'

  const noData = totalCents === 0 && activities.length === 0 && mealIdeas.length === 0

  return (
    <div className="pb-[90px] md:pb-6">
      <Masthead tripName={tripName} />
      <BreakingStrip items={breakingItems} />

      {noData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="text-[56px] mb-4">📰</div>
          <p className="text-[16px] font-bold text-foreground mb-2">Die Redaktion wartet noch auf News</p>
          <p className="text-[13px] text-muted-foreground">Sobald ihr Ausgaben eintragt, Ausflüge vorschlagt und abstimmt, entstehen hier eure persönlichen Schlagzeilen.</p>
        </div>
      ) : (
        <>
          {/* ── Stat Strip ─────────────────────────── */}
          <div className="pt-3">
            <StatStrip stats={[
              ...(totalCents > 0 ? [{ emoji: '💰', value: formatCurrency(totalCents), label: 'Ausgaben' }] : []),
              ...(totalIdeas > 0 ? [{ emoji: '💡', value: String(totalIdeas), label: 'Ideen' }] : []),
              ...(totalVotes > 0 ? [{ emoji: '🗳️', value: String(totalVotes), label: 'Votes' }] : []),
              ...(packlistTotal > 0 ? [{ emoji: '✅', value: `${packlistPct}%`, label: 'Gepackt' }] : []),
            ]} />
          </div>

          {/* ── Lead: Biggest payer ─────────────────── */}
          {paidRanking.length > 0 && (
            <>
              <SectionDivider label="Finanzen & Skandal" />
              <LeadArticle
                category="💸 Exklusiv"
                headline={
                  payerFactor && parseFloat(payerFactor) >= 1.5
                    ? `${biggestPayerName?.toUpperCase()} ZAHLTE ${payerFactor}× MEHR ALS DER NÄCHSTE`
                    : `${biggestPayerName?.toUpperCase()} FÜHRT DIE ZAHLER-RANGLISTE AN`
                }
                deck={
                  payerFactor && parseFloat(payerFactor) >= 1.5
                    ? `In einem beispiellosen Akt der Großzügigkeit (oder Vergesslichkeit?) übernahm ${biggestPayerName} allein ${formatCurrency(biggestPayerCents)} — das entspricht ${Math.round((biggestPayerCents / (totalCents || 1)) * 100)}% der Gesamtkosten. Die Redaktion verneigt sich.`
                    : `${biggestPayerName} führt die Zahler-Rangliste mit ${formatCurrency(biggestPayerCents)} an. ${totalCents > 0 ? `Das sind ${Math.round((biggestPayerCents / totalCents) * 100)}% aller Ausgaben.` : ''}`
                }
                emoji="🤑"
                tag="Zahler-Rangliste Nr. 1"
              />
            </>
          )}

          {/* ── Ranking: Who paid most ──────────────── */}
          {paidRows.length > 0 && (
            <RankingArticle title="WER HAT AM MEISTEN GEZAHLT?" rows={paidRows} />
          )}

          {/* ── Top category ───────────────────────── */}
          {topCategory && (
            <WideArticle
              icon="🏷️"
              category="Ausgaben-Analyse"
              headline={`${(categoryLabels[topCategory[0] as keyof typeof categoryLabels] ?? topCategory[0]).toUpperCase()}: DER GRÖSSTE AUSGABEN-POSTEN`}
              deck={`${formatCurrency(topCategory[1])} — das entspricht ${Math.round((topCategory[1] / (totalCents || 1)) * 100)}% aller Ausgaben. Die Prioritäten sind damit klar.`}
              tag={`von ${formatCurrency(totalCents)} gesamt · ${totalExpenseCount} Buchungen`}
            />
          )}

          {/* ── Grid: top activity + top meal ──────── */}
          {(topActivity || topMeal) && (
            <>
              <SectionDivider label="Ausflüge & Essen" />
              <div className="px-4 mb-3 grid grid-cols-2 gap-2.5">
                {topActivity && (
                  <GridArticle
                    category="✈️ Ausflüge"
                    headline={`${topActivity.title.toUpperCase()} — DAS VOLK HAT ENTSCHIEDEN`}
                    deck={`Mit ${activityYesCounts.get(topActivity.id) ?? 0} Ja-Stimmen ist dieser Ausflug unangefochtener Favorit.`}
                    emoji={topActivity.cover_emoji ?? activityTypeEmoji[topActivity.activity_type]}
                    tag={`${activityYesCounts.get(topActivity.id) ?? 0} × dabei`}
                  />
                )}
                {topMeal && (
                  <GridArticle
                    category="🍽️ Essen"
                    headline={`${topMeal.title.toUpperCase()} ALS ESSEN-CHAMPION GEKÜRT`}
                    deck={`${topMeal.votes} Votes — der Gaumen der Gruppe spricht eine klare Sprache.`}
                    emoji={topMeal.emoji}
                    tag={`${topMeal.votes} Stimmen`}
                  />
                )}
              </div>
            </>
          )}

          {/* ── Quote: Fun fact ─────────────────────── */}
          {totalVotes > 0 && (
            <QuoteBox
              text={`${totalVotes} Votes für ${totalIdeas} Ideen — und das alles nur für ${tripName}.`}
              sub="📊 Fun Fact · Abstimmungs-Bilanz der Gruppe"
            />
          )}

          {/* ── Proposal ranking ────────────────────── */}
          {proposalRows.length > 0 && (
            <>
              <SectionDivider label="Ideenreichste Köpfe" />
              <RankingArticle title="WER HAT AM MEISTEN VORGESCHLAGEN?" rows={proposalRows} />
            </>
          )}

          {/* ── Top proposer wide article ───────────── */}
          {topProposer && (
            <WideArticle
              icon="💡"
              category="✈️ Ausflüge & Essen"
              headline={`${(participantMap.get(topProposer[0])?.name ?? '').toUpperCase()} ALS UNERMÜDLICHE IDEENGEBERIN GEEHRT`}
              deck={`${topProposer[1]} Vorschläge eingereicht. Das Team schaut dankbar hinterher.`}
              tag="Ideenmaschine der Reise"
            />
          )}

          {/* ── Packlist ────────────────────────────── */}
          {packlistTotal > 0 && (
            <>
              <SectionDivider label="Packliste & Logistik" />
              <WideArticle
                icon="🧳"
                category="✅ Packliste"
                headline={packlistPct === 100 ? 'PACKLISTE: VOLLSTÄNDIG ABGEHAKT — HISTORISCH!' : `PACKLISTE: ${packlistPct}% ERLEDIGT`}
                deck={
                  packlistPct === 100
                    ? `Alle ${packlistTotal} Items eingepackt. Eine logistische Meisterleistung. Der Rest der Welt staunt.`
                    : `${packlistChecked} von ${packlistTotal} Items abgehakt. ${packlistTotal - packlistChecked} Items warten noch. Die Redaktion hält den Atem an.`
                }
                tag={`${packlistChecked}/${packlistTotal} Items`}
              />
            </>
          )}

          {/* ── CTA ─────────────────────────────────── */}
          <SectionDivider label="Redaktioneller Aufruf" />
          <CtaBanner tripId={tripId} />
        </>
      )}
    </div>
  )
}
