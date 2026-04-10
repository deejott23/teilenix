import type { ExpenseWithSplits } from '@/types/app'

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`)
  return res.json()
}

export const fetchers = {
  expenses: (tripId: string) =>
    apiFetch<ExpenseWithSplits[]>(`/api/trips/${tripId}/expenses`),

  packlist: (tripId: string) =>
    apiFetch<unknown[]>(`/api/trips/${tripId}/packlist`),

  shopping: (tripId: string) =>
    apiFetch<unknown[]>(`/api/trips/${tripId}/shopping`),

  dashboardTrips: () =>
    apiFetch<unknown[]>('/api/trips'),
}
