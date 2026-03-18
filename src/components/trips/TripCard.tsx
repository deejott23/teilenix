import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/formatting'
import type { Trip } from '@/types/app'
import { cn } from '@/lib/utils'
import { pickFallbackEmoji } from '@/lib/tripEmojis'

interface TripCardProps {
  trip: Trip
}

export default function TripCard({ trip }: TripCardProps) {
  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
    : trip.start_date ? `ab ${formatDate(trip.start_date)}` : null
  const active = trip.status === 'active'
  const emoji = (trip.cover_emoji as string | null) ?? pickFallbackEmoji(trip.name)

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className={cn(
        'rounded-2xl card-shadow p-4 flex items-center gap-4 transition-all',
        active ? 'bg-card group-hover:card-shadow-hover' : 'bg-card/60 opacity-80 group-hover:opacity-100'
      )}>
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
          active ? 'bg-primary/12' : 'bg-muted/70'
        )}>
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={cn(
              'font-semibold text-[15px] truncate',
              active ? 'text-foreground' : 'text-foreground/70'
            )}>
              {trip.name}
            </h3>
            {active ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Aktiv
              </span>
            ) : (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-muted text-muted-foreground/60 text-[10px] font-semibold">
                Fertig
              </span>
            )}
          </div>
          {dateRange && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Calendar className="w-3 h-3" strokeWidth={2} />
              {dateRange}
            </div>
          )}
        </div>

        <ArrowRight
          className={cn(
            'w-4 h-4 flex-shrink-0 transition-all',
            active
              ? 'text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5'
              : 'text-muted-foreground/20 group-hover:text-muted-foreground/50'
          )}
          strokeWidth={2}
        />
      </div>
    </Link>
  )
}
