import Link from 'next/link'
import { ChevronRight, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/formatting'
import type { Trip } from '@/types/app'

interface TripCardProps {
  trip: Trip
  familyId: string
}

export default function TripCard({ trip }: TripCardProps) {
  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
    : trip.start_date
    ? `ab ${formatDate(trip.start_date)}`
    : null

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
        {/* Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl">✈️</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{trip.name}</h3>
            {trip.status === 'ended' && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Abgeschlossen
              </Badge>
            )}
            {trip.status === 'active' && (
              <Badge className="text-xs flex-shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                Aktiv
              </Badge>
            )}
          </div>
          {dateRange && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{dateRange}</span>
            </div>
          )}
          {trip.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{trip.description}</p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
      </div>
    </Link>
  )
}
