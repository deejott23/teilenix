'use client'
import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityType } from '@/types/app'
import { activityTypeEmoji, activityTypeLabel } from '@/lib/activities'

const ACTIVITY_TYPES: ActivityType[] = ['activity', 'boat', 'food', 'culture', 'swimming', 'shopping', 'other']
const DURATION_OPTIONS = ['1h', '2h', '3h', '4h', 'Halbtag', 'Ganztag']

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

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

interface ActivityInitialValues {
  title: string
  activity_type: ActivityType
  description: string | null
  link: string | null
  departure_time: string | null
  duration_label: string | null
  meeting_point: string | null
  cost_per_person_cents: number | null
  activity_date: string | null
}

interface AddActivitySheetProps {
  tripId: string
  myParticipantId: string
  tripStartDate: string | null
  tripEndDate: string | null
  defaultDate?: string | null
  initialValues?: ActivityInitialValues
  onClose: () => void
  onAdd: (data: object) => Promise<void>
}

export default function AddActivitySheet({
  tripStartDate, tripEndDate, defaultDate, initialValues, onClose, onAdd,
}: AddActivitySheetProps) {
  const isEdit = !!initialValues
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [activityType, setActivityType] = useState<ActivityType>(initialValues?.activity_type ?? 'activity')
  const [selectedDate, setSelectedDate] = useState<string | null>(initialValues?.activity_date ?? defaultDate ?? null)
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [link, setLink] = useState(initialValues?.link ?? '')
  const [departureTime, setDepartureTime] = useState(initialValues?.departure_time ?? '')
  const [durationLabel, setDurationLabel] = useState<string | null>(initialValues?.duration_label ?? null)
  const [meetingPoint, setMeetingPoint] = useState(initialValues?.meeting_point ?? '')
  const [costEuros, setCostEuros] = useState(
    initialValues?.cost_per_person_cents != null
      ? (initialValues.cost_per_person_cents / 100).toFixed(2)
      : ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [showDetails, setShowDetails] = useState(isEdit && !!(
    initialValues?.departure_time || initialValues?.duration_label ||
    initialValues?.meeting_point || initialValues?.cost_per_person_cents != null
  ))

  const tripDates = generateDateRange(tripStartDate, tripEndDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const costCents = costEuros ? Math.round(parseFloat(costEuros.replace(',', '.')) * 100) : null
      await onAdd({
        title: title.trim(),
        activity_type: activityType,
        activity_date: selectedDate,
        description: description.trim() || null,
        link: link.trim() || null,
        departure_time: departureTime || null,
        duration_label: durationLabel,
        meeting_point: meetingPoint.trim() || null,
        cost_per_person_cents: costCents && !isNaN(costCents) ? costCents : null,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full bg-card rounded-t-3xl max-h-[92vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-[17px] font-bold text-foreground">{isEdit ? 'Ausflug bearbeiten' : 'Ausflug vorschlagen'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-28 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Bootsfahrt zum Leuchtturm"
              required
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px] placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Activity type */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Typ
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border-[1.5px] transition-all',
                    activityType === type
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span>{activityTypeEmoji[type]}</span>
                  <span>{activityTypeLabel[type]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date strip */}
          {tripDates.length > 0 && (
            <div>
              <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Datum
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-bold border-[1.5px] transition-all',
                    selectedDate === null
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span>📅</span>
                  <span className="mt-0.5">Offen</span>
                </button>
                {tripDates.map(d => {
                  const iso = toISODate(d)
                  const isSelected = selectedDate === iso
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      className={cn(
                        'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-bold border-[1.5px] transition-all min-w-[48px]',
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      <span className="text-[10px] font-semibold opacity-80">{WEEKDAY_SHORT[d.getDay()]}</span>
                      <span className="text-[14px] font-bold">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Was ist geplant? Warum sollten alle mitmachen? 😄"
              rows={2}
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px] placeholder:text-muted-foreground/60 resize-none"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Link (optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px] placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Optional fields toggle */}
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-wide"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showDetails && 'rotate-180')} strokeWidth={2.5} />
            Weitere Details
          </button>

          {showDetails && (
            <div className="space-y-5">
              {/* Departure time */}
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Abfahrtszeit
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px]"
                />
              </div>

              {/* Duration chips */}
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Dauer
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationLabel(durationLabel === d ? null : d)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-[12px] font-semibold border-[1.5px] transition-all',
                        durationLabel === d
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting point */}
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Treffpunkt
                </label>
                <input
                  type="text"
                  value={meetingPoint}
                  onChange={e => setMeetingPoint(e.target.value)}
                  placeholder="z.B. Hafen, Eingang Nord"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px] placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Kosten/Person ca.
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={costEuros}
                    onChange={e => setCostEuros(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px] placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className={cn(
              'w-full py-3 rounded-[14px] font-bold text-[15px] transition-all active:scale-[0.98]',
              submitting || !title.trim()
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary text-white hover:bg-primary/90'
            )}
          >
            {submitting ? (isEdit ? 'Wird gespeichert…' : 'Wird vorgeschlagen…') : (isEdit ? 'Speichern' : 'Ausflug vorschlagen 🗺️')}
          </button>
        </form>
      </div>
    </div>
  )
}
