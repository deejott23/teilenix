import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // 1 min — verhindert unnötige Refetches bei Navigation
        gcTime: 5 * 60 * 1000,       // 5 min — Cache bleibt bei Back-Navigation erhalten
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
