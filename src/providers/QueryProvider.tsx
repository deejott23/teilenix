'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { makeQueryClient } from '@/lib/query/queryClient'

// Browser-Singleton — verhindert, dass bei jedem Re-Render ein neuer Client entsteht
let browserQueryClient: QueryClient | undefined

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: immer frischen Client (kein Request-Sharing)
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient())

  // IndexedDB-Persistenz nur im Browser einrichten
  useEffect(() => {
    import('@/lib/query/persistence').then(({ attachPersistence }) => {
      attachPersistence(queryClient)
    })
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
