import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/formatting'
import type { Trip } from '@/types/app'
import { cn } from '@/lib/utils'

interface TripCardProps {
  trip: Trip
}

const EMOJIS = ['🌴', '🏔️', '🗺️', '🌅', '⛵', '🏖️', '🌍', '🏕️']
const pickEmoji = (name: string) => EMOJIS[name.charCodeAt(0) % EMOJIS.length]

export default function TripCard({ trip }: TripCardProps) {
  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
    : trip.start_date ? `ab ${formatDate(trip.start_date)}` : null
  const active = trip.status === 'active'

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className="bg-card rounded-2xl card-shadow group-hover:card-shadow-hover transition-shadow p-4 flex items-center gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
          active ? 'bg-primary/10' : 'bg-muted'
        )}>
          {pickEmoji(trip.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground text-[15px] truncate">{trip.name}</h3>
            {active ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktiv
              </span>
            ) : (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                Fertig
              </span>
            )}
          </div>
          {dateRange && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" strokeWidth={2} />
              {dateRange}
            </div>
          )}
        </div>

        <ArrowRight
          className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0"
          strokeWidth={2}
        />
      </div>
    </Link>
  )
}
