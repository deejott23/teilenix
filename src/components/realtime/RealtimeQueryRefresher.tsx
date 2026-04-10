'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query/queryKeys'

// Mapping: Supabase-Tabelle → betroffener Query-Key (nur gezielt invalidieren, kein full-refresh)
const TABLE_KEYS: Record<string, (tripId: string) => readonly unknown[]> = {
  expenses:         (t) => queryKeys.expenses.withSplits(t),
  expense_splits:   (t) => queryKeys.expenses.withSplits(t),
  packlist_items:   (t) => queryKeys.packlist.byTrip(t),
  packlist_checks:  (t) => queryKeys.packlist.byTrip(t),
  packlist_claims:  (t) => queryKeys.packlist.byTrip(t),
  shopping_items:   (t) => queryKeys.shopping.byTrip(t),
  trip_activities:  (t) => queryKeys.activities.byTrip(t),
  trip_meal_ideas:  (t) => queryKeys.meals.byTrip(t),
  trip_meal_votes:  (t) => queryKeys.meals.byTrip(t),
  trip_meal_slots:  (t) => queryKeys.meals.byTrip(t),
}

interface Props {
  tripId: string
  tables: string[]
}

/**
 * Drop-in-Ersatz für RealtimePageRefresher.
 * Invalidiert gezielt TanStack Query-Keys statt router.refresh() auszulösen.
 */
export default function RealtimeQueryRefresher({ tripId, tables }: Props) {
  const queryClient = useQueryClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const pending = new Set<readonly unknown[]>()

    function schedule(key: readonly unknown[]) {
      pending.add(key)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        pending.forEach(k => queryClient.invalidateQueries({ queryKey: k }))
        pending.clear()
      }, 300)
    }

    const channels = tables.map(table => {
      const getKey = TABLE_KEYS[table]
      if (!getKey) return null
      return supabase
        .channel(`tq-${table}-${tripId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `trip_id=eq.${tripId}` },
          () => schedule(getKey(tripId))
        )
        .subscribe()
    }).filter(Boolean)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      channels.forEach(ch => ch && supabase.removeChannel(ch))
    }
  }, [tripId, tables, queryClient])

  return null
}
