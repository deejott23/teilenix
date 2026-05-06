'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query/queryKeys'
import { activityTypeEmoji } from '@/lib/activities'
import dynamic from 'next/dynamic'
import type { ActivityWithVotes, MealIdea, MealSlot } from '@/types/app'

const SlotPickerSheet = dynamic(() => import('@/components/essen/SlotPickerSheet'), { ssr: false })
const AddActivitySheet = dynamic(() => import('@/components/activities/AddActivitySheet'), { ssr: false })

// ── Helpers ────────────────────────────────────────────────────────────────

function generateDateRange(start: string | null, end: string | null): Date[] {
  if (!start || !end) return []
  const dates: Date[] = []
  const current = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (current <= last) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')
}

async function fetchMeals(tripId: string): Promise<{ ideas: MealIdea[]; slots: MealSlot[] }> {
  const res = await fetch(`/api/trips/${tripId}/meals`)
  if (!res.ok) throw new Error('Failed to fetch meals')
  return res.json()
}

// ── Props ──────────────────────────────────────────────────────────────────

interface UnifiedKalenderViewProps {
  tripId: string
  initialActivities: ActivityWithVotes[]
  tripStartDate: string | null
  tripEndDate: string | null
  myParticipantId: string
  isActive: boolean
}

interface ActiveSlot {
  date: string
  type: 'lunch' | 'dinner'
}

// ── Component ──────────────────────────────────────────────────────────────

export default function UnifiedKalenderView({
  tripId,
  initialActivities,
  tripStartDate,
  tripEndDate,
  myParticipantId,
  isActive,
}: UnifiedKalenderViewProps) {
  const queryClient = useQueryClient()
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [addForDate, setAddForDate] = useState<string | null>(null)

  const { data: mealsData } = useQuery({
    queryKey: queryKeys.meals.byTrip(tripId),
    queryFn: () => fetchMeals(tripId),
  })

  const ideas = mealsData?.ideas ?? []
  const slots = mealsData?.slots ?? []

  const handleMealRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meals.byTrip(tripId) })
  }

  const handleAddActivity = async (data: object) => {
    const res = await fetch(`/api/trips/${tripId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byTrip(tripId) })
  }

  const dates = generateDateRange(tripStartDate, tripEndDate)
  const today = new Date().toISOString().slice(0, 10)

  // Group activities by date
  const activitiesByDate = new Map<string, ActivityWithVotes[]>()
  const undatedActivities: ActivityWithVotes[] = []
  for (const a of initialActivities) {
    if (a.activity_date) {
      const list = activitiesByDate.get(a.activity_date) ?? []
      list.push(a)
      activitiesByDate.set(a.activity_date, list)
    } else {
      undatedActivities.push(a)
    }
  }

  const getSlot = (date: string, type: 'lunch' | 'dinner') =>
    slots.find(s => s.slot_date === date && s.slot_type === type)

  const getIdea = (slot?: MealSlot) => {
    if (!slot?.meal_idea_id) return undefined
    return ideas.find(i => i.id === slot.meal_idea_id)
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-[48px] block mb-3">📅</span>
        <p className="text-[15px] font-bold text-foreground mb-1">Kein Reisezeitraum gesetzt</p>
        <p className="text-[13px] text-muted-foreground">
          Lege Start- und Enddatum der Reise in den Einstellungen fest.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 pb-[90px] md:pb-6">
        {/* Column header labels */}
        <div className="grid grid-cols-2 gap-2 px-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
            🍽️ Essen
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
            ✈️ Ausflüge
          </p>
        </div>

        {dates.map(date => {
          const iso = toISODate(date)
          const isToday = iso === today
          const dayActivities = activitiesByDate.get(iso) ?? []
          const lunchIdea = getIdea(getSlot(iso, 'lunch'))
          const dinnerIdea = getIdea(getSlot(iso, 'dinner'))
          const hasLunch = !!lunchIdea
          const hasDinner = !!dinnerIdea
          const hasActivity = dayActivities.length > 0

          return (
            <div
              key={iso}
              className={cn(
                'bg-card rounded-[16px] border overflow-hidden',
                isToday ? 'border-primary/50 shadow-[0_0_0_2px] shadow-primary/20' : 'border-border card-shadow'
              )}
            >
              {/* Day header */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 border-b',
                isToday ? 'bg-primary/8 border-primary/20' : 'bg-muted/40 border-border'
              )}>
                <div className="flex items-center gap-1.5 flex-1">
                  <span className={cn(
                    'text-[11px] font-bold uppercase tracking-wide',
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {formatWeekday(date)}
                  </span>
                  <span className={cn(
                    'text-[15px] font-extrabold leading-none',
                    isToday ? 'text-primary' : 'text-foreground'
                  )}>
                    {date.getDate()}
                  </span>
                  <span className={cn(
                    'text-[11px]',
                    isToday ? 'text-primary/80' : 'text-muted-foreground'
                  )}>
                    {date.toLocaleDateString('de-DE', { month: 'short' })}
                  </span>
                  {isToday && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold uppercase tracking-wide">
                      Heute
                    </span>
                  )}
                </div>

                {/* Completion dots */}
                <div className="flex items-center gap-1">
                  <span className={cn('w-2 h-2 rounded-full', hasLunch ? 'bg-amber-400' : 'bg-muted-foreground/20')} title="Mittag" />
                  <span className={cn('w-2 h-2 rounded-full', hasDinner ? 'bg-orange-400' : 'bg-muted-foreground/20')} title="Abend" />
                  <span className={cn('w-2 h-2 rounded-full', hasActivity ? 'bg-primary' : 'bg-muted-foreground/20')} title="Ausflug" />
                </div>
              </div>

              {/* Two-column content */}
              <div className="grid grid-cols-2 divide-x divide-border">
                {/* Left: Essen */}
                <div className="p-2 space-y-1.5">
                  <MealPill
                    label="Mittag"
                    idea={lunchIdea}
                    isActive={isActive}
                    tripId={tripId}
                    onClick={() => setActiveSlot({ date: iso, type: 'lunch' })}
                  />
                  <MealPill
                    label="Abend"
                    idea={dinnerIdea}
                    isActive={isActive}
                    tripId={tripId}
                    onClick={() => setActiveSlot({ date: iso, type: 'dinner' })}
                  />
                </div>

                {/* Right: Ausflüge */}
                <div className="p-2 space-y-1.5">
                  {dayActivities.length === 0 ? (
                    isActive ? (
                      <button
                        type="button"
                        onClick={() => { setAddForDate(iso); setShowAddSheet(true) }}
                        className="w-full flex items-center justify-center gap-1 border border-dashed border-muted-foreground/30 rounded-[10px] px-2 py-3 text-[11px] text-muted-foreground/50 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                        Ausflug
                      </button>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/40 italic text-center py-2">—</p>
                    )
                  ) : (
                    <>
                      {dayActivities.map(a => (
                        <ActivityPill key={a.id} activity={a} tripId={tripId} />
                      ))}
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => { setAddForDate(iso); setShowAddSheet(true) }}
                          className="w-full flex items-center justify-center gap-1 border border-dashed border-muted-foreground/20 rounded-[10px] px-2 py-1 text-[10px] text-muted-foreground/40 hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Undated activities */}
        {undatedActivities.length > 0 && (
          <div className="bg-card rounded-[16px] card-shadow border border-border overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border bg-muted/40">
              <p className="text-[12px] font-bold text-muted-foreground">📌 Noch kein Datum</p>
            </div>
            <div className="p-2 space-y-1.5">
              {undatedActivities.map(a => (
                <ActivityPill key={a.id} activity={a} tripId={tripId} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meal slot picker */}
      {activeSlot && (
        <SlotPickerSheet
          tripId={tripId}
          slotDate={activeSlot.date}
          slotType={activeSlot.type}
          ideas={ideas}
          currentMealId={getSlot(activeSlot.date, activeSlot.type)?.meal_idea_id ?? null}
          onClose={() => setActiveSlot(null)}
          onRefresh={handleMealRefresh}
        />
      )}

      {/* Add activity sheet */}
      {showAddSheet && (
        <AddActivitySheet
          tripId={tripId}
          myParticipantId={myParticipantId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          defaultDate={addForDate}
          onClose={() => { setShowAddSheet(false); setAddForDate(null) }}
          onAdd={handleAddActivity}
        />
      )}
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MealPill({
  label,
  idea,
  isActive,
  tripId,
  onClick,
}: {
  label: string
  idea: MealIdea | undefined
  isActive: boolean
  tripId: string
  onClick: () => void
}) {
  if (idea) {
    return (
      <Link
        href={`/trips/${tripId}/essen/${idea.id}`}
        className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-[10px] px-2 py-1.5 min-w-0 hover:bg-amber-100 transition-colors"
      >
        <span className="text-[14px] flex-shrink-0">{idea.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{idea.title}</p>
          <p className="text-[9px] text-amber-600/80">{label}</p>
        </div>
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={isActive ? onClick : undefined}
      disabled={!isActive}
      className={cn(
        'w-full flex items-center gap-1.5 border border-dashed rounded-[10px] px-2 py-1.5 transition-colors',
        isActive
          ? 'border-amber-300/60 text-amber-600/60 hover:border-amber-400 hover:text-amber-600'
          : 'border-muted-foreground/20 text-muted-foreground/30 cursor-default'
      )}
    >
      <span className="text-[11px] flex-shrink-0">{label === 'Mittag' ? '☀️' : '🌙'}</span>
      <span className="text-[10px]">{isActive ? '+ belegen' : '—'}</span>
    </button>
  )
}

function ActivityPill({
  activity,
  tripId,
}: {
  activity: ActivityWithVotes
  tripId: string
}) {
  const emoji = activity.cover_emoji ?? activityTypeEmoji[activity.activity_type] ?? '📍'
  const isConfirmed = activity.status === 'confirmed'

  return (
    <Link
      href={`/trips/${tripId}/planen/${activity.id}`}
      className={cn(
        'flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 min-w-0 transition-colors',
        isConfirmed
          ? 'bg-green-50 border border-green-200 hover:bg-green-100'
          : 'bg-amber-50/50 border border-amber-200/60 hover:bg-amber-50'
      )}
    >
      <span className="text-[14px] flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{activity.title}</p>
        <p className={cn('text-[9px]', isConfirmed ? 'text-green-600' : 'text-amber-600/80')}>
          {isConfirmed
            ? activity.departure_time ? `${activity.departure_time.slice(0, 5)} Uhr` : '✓'
            : '💡 Idee'}
        </p>
      </div>
    </Link>
  )
}
