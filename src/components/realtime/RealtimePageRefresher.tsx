'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tripId: string
  /** One or more Supabase table names to watch */
  tables: string[]
}

/**
 * Invisible component that subscribes to Supabase Realtime for the given
 * tables + tripId filter and calls router.refresh() on any change.
 * Place it inside a Server Component page to get live updates.
 */
export default function RealtimePageRefresher({ tripId, tables }: Props) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    function scheduleRefresh() {
      // Debounce: wait 300ms after last event before refreshing
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => router.refresh(), 300)
    }

    const channels = tables.map(table =>
      supabase
        .channel(`realtime-${table}-${tripId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `trip_id=eq.${tripId}`,
          },
          scheduleRefresh
        )
        .subscribe()
    )

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [tripId, tables, router])

  return null
}
