import { get, set, del } from 'idb-keyval'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { dehydrate } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

const IDB_KEY = 'sharepa-query-cache'

const idbStorage = {
  getItem:    (key: string): Promise<string | null> => get(key).then(v => v ?? null),
  setItem:    (key: string, value: string): Promise<void> => set(key, value),
  removeItem: (key: string): Promise<void> => del(key),
}

/**
 * Bindet den QueryClient an IndexedDB als persistenten Cache.
 * Nur auf dem Client aufrufen (kein SSR).
 */
export function attachPersistence(queryClient: QueryClient) {
  persistQueryClient({
    queryClient,
    persister: {
      persistClient: async (client) => {
        // client ist PersistedClient — wir serialisieren den dehydrierten State direkt
        await idbStorage.setItem(IDB_KEY, JSON.stringify(client))
      },
      restoreClient: async () => {
        const raw = await idbStorage.getItem(IDB_KEY)
        if (!raw) return undefined
        try {
          return JSON.parse(raw)
        } catch {
          return undefined
        }
      },
      removeClient: () => idbStorage.removeItem(IDB_KEY),
    },
    maxAge: 24 * 60 * 60 * 1000, // 24h
  })
}

// Für manuelle Snapshots (z.B. beim Logout)
export { dehydrate }
