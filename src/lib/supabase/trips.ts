import { cache } from 'react'
import { createClient } from './server'
import type { TripParticipant } from '@/types/app'

/**
 * Cached getTrip — deduplicates the trips DB query across layout + page
 * within the same request using React's per-request cache().
 * Selects all columns needed by any page to avoid multiple queries.
 */
export const getTrip = cache(async (tripId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trips')
    .select('id, name, status, cover_emoji, cover_image_url, start_date, end_date, created_by, show_packlist')
    .eq('id', tripId)
    .maybeSingle()
  return data
})

/**
 * Cached getParticipants — deduplicates trip_participants queries across all
 * Server Components within the same request (BalanceCard, ActivityStream, etc.)
 * Fetches the superset of columns needed by any consumer.
 */
export const getParticipants = cache(async (tripId: string): Promise<TripParticipant[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trip_participants')
    .select('id, name, shares, user_id, group_id, is_group')
    .eq('trip_id', tripId)
  return (data ?? []) as TripParticipant[]
})
