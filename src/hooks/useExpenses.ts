'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query/queryKeys'
import { fetchers } from '@/lib/query/fetchers'
import type { ExpenseWithSplits } from '@/types/app'

export function useExpenses(tripId: string, initialData?: ExpenseWithSplits[]) {
  return useQuery({
    queryKey: queryKeys.expenses.withSplits(tripId),
    queryFn: () => fetchers.expenses(tripId),
    // initialData sofort als veraltet markieren → TQ holt im Hintergrund frische Daten
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

// ── Mutation: Ausgabe löschen ────────────────────────────────────────────────

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.expenses.withSplits(tripId)

  return useMutation({
    mutationFn: (expenseId: string) =>
      fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) throw new Error('Löschen fehlgeschlagen')
      }),

    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ExpenseWithSplits[]>(key)
      queryClient.setQueryData<ExpenseWithSplits[]>(key, old =>
        (old ?? []).filter(e => e.id !== expenseId)
      )
      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Fehler beim Löschen')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
