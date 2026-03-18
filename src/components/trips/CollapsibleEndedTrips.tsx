'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TripCard from './TripCard'
import type { Trip } from '@/types/app'

interface CollapsibleEndedTripsProps {
  trips: Trip[]
}

export default function CollapsibleEndedTrips({ trips }: CollapsibleEndedTripsProps) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-0.5 py-1 mb-2"
      >
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Abgeschlossen ({trips.length})
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="space-y-2.5">
          {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  )
}
