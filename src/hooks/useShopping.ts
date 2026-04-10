'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query/queryKeys'
import { fetchers } from '@/lib/query/fetchers'

type ShoppingItem = {
  id: string
  trip_id: string
  title: string
  category: string
  quantity: number
  is_bought: boolean
  added_by_participant_id: string | null
  created_at: string
}

export function useShopping(tripId: string, initialData?: ShoppingItem[]) {
  return useQuery({
    queryKey: queryKeys.shopping.byTrip(tripId),
    queryFn: () => fetchers.shopping(tripId) as Promise<ShoppingItem[]>,
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

// ── Mutation: Artikel hinzufügen ─────────────────────────────────────────────

export function useAddShoppingItem(tripId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.shopping.byTrip(tripId)

  return useMutation({
    mutationFn: (payload: { title: string; category: string; quantity: number }) =>
      fetch(`/api/trips/${tripId}/shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<ShoppingItem> }),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ShoppingItem[]>(key)
      const optimistic: ShoppingItem = {
        id: `temp-${Date.now()}`,
        trip_id: tripId,
        is_bought: false,
        added_by_participant_id: null,
        created_at: new Date().toISOString(),
        ...payload,
      }
      queryClient.setQueryData<ShoppingItem[]>(key, old => [...(old ?? []), optimistic])
      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Fehler beim Hinzufügen')
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

// ── Mutation: Artikel als gekauft markieren ──────────────────────────────────

export function useToggleShoppingBought(tripId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.shopping.byTrip(tripId)

  return useMutation({
    mutationFn: ({ id, is_bought }: { id: string; is_bought: boolean }) =>
      fetch(`/api/trips/${tripId}/shopping/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_bought }),
      }).then(r => { if (!r.ok) throw new Error() }),

    onMutate: async ({ id, is_bought }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ShoppingItem[]>(key)
      queryClient.setQueryData<ShoppingItem[]>(key, old =>
        (old ?? []).map(i => i.id === id ? { ...i, is_bought } : i)
      )
      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Fehler')
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

// ── Mutation: Menge ändern ───────────────────────────────────────────────────

export function useUpdateShoppingQty(tripId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.shopping.byTrip(tripId)

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      fetch(`/api/trips/${tripId}/shopping/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      }).then(r => { if (!r.ok) throw new Error() }),

    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ShoppingItem[]>(key)
      queryClient.setQueryData<ShoppingItem[]>(key, old =>
        (old ?? []).map(i => i.id === id ? { ...i, quantity } : i)
      )
      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Fehler')
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

// ── Mutation: Artikel löschen ────────────────────────────────────────────────

export function useDeleteShoppingItem(tripId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.shopping.byTrip(tripId)

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/trips/${tripId}/shopping/${id}`, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error() }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ShoppingItem[]>(key)
      queryClient.setQueryData<ShoppingItem[]>(key, old =>
        (old ?? []).filter(i => i.id !== id)
      )
      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Fehler')
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

// ── Mutation: Alle gekauften löschen ─────────────────────────────────────────

export function useClearBoughtItems(tripId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.shopping.byTrip(tripId)

  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id =>
        fetch(`/api/trips/${tripId}/shopping/${id}`, { method: 'DELETE' })
      )).then(results => {
        if (results.some(r => !r.ok)) throw new Error()
      }),

    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ShoppingItem[]>(key)
      queryClient.setQueryData<ShoppingItem[]>(key, old =>
        (old ?? []).filter(i => !ids.includes(i.id))
      )
      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Fehler')
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
