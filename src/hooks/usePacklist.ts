'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys } from '@/lib/query/queryKeys'
import { fetchers } from '@/lib/query/fetchers'
import type { PacklistItem } from '@/types/app'

export function usePacklist(tripId: string, initialData?: PacklistItem[]) {
  return useQuery({
    queryKey: queryKeys.packlist.byTrip(tripId),
    queryFn: () => fetchers.packlist(tripId) as Promise<PacklistItem[]>,
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

/**
 * Gibt eine stabile `invalidate`-Funktion zurück,
 * die als Drop-in-Ersatz für router.refresh() dient.
 */
export function usePacklistInvalidate(tripId: string) {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.packlist.byTrip(tripId) })
  }, [queryClient, tripId])
}
