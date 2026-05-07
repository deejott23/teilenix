import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink, ShoppingCart } from 'lucide-react'
import type { MealVote, MealComment, TripParticipant } from '@/types/app'
import MealDetailActions from '@/components/essen/MealDetailActions'
import MealComments from '@/components/essen/MealComments'
import MealSlotAssigner from '@/components/essen/MealSlotAssigner'

function extractHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ tripId: string; mealId: string }>
}) {
  const { tripId, mealId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: idea }, { data: votesRaw }, { data: participantsRaw }, { data: commentsRaw }, { data: trip }, { data: currentSlotRaw }] = await Promise.all([
    db.from('trip_meal_ideas').select('*').eq('id', mealId).eq('trip_id', tripId).single(),
    db.from('trip_meal_votes').select('id, meal_idea_id, participant_id, vote, created_at').eq('meal_idea_id', mealId),
    supabase.from('trip_participants').select('*').eq('trip_id', tripId),
    db.from('trip_meal_comments').select('*, trip_participants(name)').eq('meal_idea_id', mealId).order('created_at', { ascending: true }),
    supabase.from('trips').select('start_date, end_date, status').eq('id', tripId).single(),
    db.from('trip_meal_slots').select('slot_date, slot_type').eq('meal_idea_id', mealId).maybeSingle(),
  ])

  if (!idea) notFound()

  const participants = (participantsRaw ?? []) as TripParticipant[]
  const participantMap = new Map(participants.map(p => [p.id, p]))

  const me = participants.find(p => p.user_id === user.id && !p.is_group)
  const myParticipantId = me?.id ?? ''
  const myName = me?.name ?? ''

  const votes = (votesRaw ?? []) as MealVote[]
  const yesCount = votes.filter(v => v.vote === 'yes').length
  const maybeCount = votes.filter(v => v.vote === 'maybe').length
  const noCount = votes.filter(v => v.vote === 'no').length
  const totalVotes = votes.length

  const realParticipants = participants.filter(p => !p.is_group && !p.group_id)

  const comments: MealComment[] = (commentsRaw ?? []).map(
    (c: Record<string, unknown> & { trip_participants: { name: string } | null }) => ({
      id: c.id as string,
      meal_idea_id: c.meal_idea_id as string,
      participant_id: c.participant_id as string,
      content: c.content as string,
      created_at: c.created_at as string,
      participant_name: c.trip_participants?.name ?? 'Unbekannt',
    })
  )

  const currentSlot = currentSlotRaw
    ? { slot_date: currentSlotRaw.slot_date as string, slot_type: currentSlotRaw.slot_type as 'lunch' | 'dinner' }
    : null

  return (
    <div className="space-y-4 pb-6">
      {/* Back */}
      <Link
        href={`/trips/${tripId}/essen`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        Essen-Ideen
      </Link>

      {/* Hero */}
      <div className="rounded-[20px] overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 h-[100px] flex items-center justify-center relative">
        <span className="text-[64px] leading-none drop-shadow-lg">{idea.emoji}</span>
        {currentSlot && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white">
              📌 Eingeplant
            </span>
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground leading-tight">{idea.title}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Idee von {participantMap.get(idea.created_by_participant_id)?.name ?? 'Unbekannt'}
        </p>

        {idea.link && (
          <a
            href={idea.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[13px] font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {extractHostname(idea.link)}
          </a>
        )}
      </div>

      {/* Description */}
      {idea.description && (
        <div className="bg-card rounded-[18px] card-shadow p-4">
          <p className="text-[14px] text-muted-foreground leading-relaxed">{idea.description}</p>
        </div>
      )}

      {/* Tags */}
      {idea.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(idea.tags as string[]).map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Slot assigner */}
      <MealSlotAssigner
        tripId={tripId}
        mealId={mealId}
        currentSlot={currentSlot}
        tripStartDate={(trip?.start_date as string | null) ?? null}
        tripEndDate={(trip?.end_date as string | null) ?? null}
      />

      {/* Voting card */}
      <div className="bg-card rounded-[18px] card-shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-foreground">Abstimmung</h2>
          <div className="flex gap-3 text-[12px] text-muted-foreground">
            {yesCount > 0 && <span className="font-semibold text-green-600">{yesCount} lecker</span>}
            {maybeCount > 0 && <span>{maybeCount} egal</span>}
            {noCount > 0 && <span>{noCount} nein</span>}
          </div>
        </div>

        {totalVotes > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
            {yesCount > 0 && <div className="bg-green-400 transition-all" style={{ flex: yesCount }} />}
            {maybeCount > 0 && <div className="bg-amber-400 transition-all" style={{ flex: maybeCount }} />}
            {noCount > 0 && <div className="bg-red-300 transition-all" style={{ flex: noCount }} />}
            {totalVotes < realParticipants.length && <div className="bg-muted flex-1" />}
          </div>
        )}

        {totalVotes > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {votes.map(vote => {
              const p = participantMap.get(vote.participant_id)
              if (!p) return null
              return (
                <span key={vote.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold">
                  {vote.vote === 'yes' ? '😋' : vote.vote === 'maybe' ? '🤷' : '🙅'}
                  {p.name}
                </span>
              )
            })}
          </div>
        )}

        <MealDetailActions
          mealId={mealId}
          tripId={tripId}
          myParticipantId={myParticipantId}
          initialVotes={votes}
          isMyMeal={idea.created_by_participant_id === myParticipantId}
        />
      </div>

      {/* Comments */}
      <MealComments
        mealId={mealId}
        tripId={tripId}
        myParticipantId={myParticipantId}
        myName={myName}
        initialComments={comments}
      />

      {/* Shopping list link */}
      <Link
        href={`/trips/${tripId}/einkauf`}
        className="flex items-center gap-3 bg-card rounded-[18px] card-shadow p-4 border border-border active:scale-[0.98] transition-transform"
      >
        <ShoppingCart className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <div className="text-[13px] font-bold text-foreground">Zum Einkaufszettel</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Zutaten direkt auf die Einkaufsliste setzen</div>
        </div>
        <span className="text-[14px] font-bold text-primary">→</span>
      </Link>
    </div>
  )
}
