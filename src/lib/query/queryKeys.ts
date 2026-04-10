/**
 * Zentraler Query-Key-Factory.
 * Alle trip-scoped Keys enthalten tripId an Stelle 1, so dass
 * queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
 * alles für eine Trip auf einmal invalidiert.
 */
export const queryKeys = {
  trips: {
    all:    () => ['trips'] as const,
    list:   () => ['trips', 'list'] as const,
    detail: (tripId: string) => ['trips', tripId] as const,
  },
  participants: {
    byTrip: (tripId: string) => ['trips', tripId, 'participants'] as const,
  },
  expenses: {
    byTrip:     (tripId: string) => ['trips', tripId, 'expenses'] as const,
    withSplits: (tripId: string) => ['trips', tripId, 'expenses', 'withSplits'] as const,
  },
  packlist: {
    byTrip: (tripId: string) => ['trips', tripId, 'packlist'] as const,
  },
  shopping: {
    byTrip: (tripId: string) => ['trips', tripId, 'shopping'] as const,
  },
  activities: {
    byTrip:  (tripId: string) => ['trips', tripId, 'activities'] as const,
    detail:  (tripId: string, activityId: string) => ['trips', tripId, 'activities', activityId] as const,
  },
  meals: {
    byTrip: (tripId: string) => ['trips', tripId, 'meals'] as const,
  },
  dashboard: {
    trips: () => ['dashboard', 'trips'] as const,
  },
} as const
