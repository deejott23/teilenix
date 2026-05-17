import { cache } from 'react'
import { createClient } from './server'

/**
 * Cached getTrip — deduplicates the trips DB query across layout + page
 * within the same request using React's per-request cache().
 * Selects all columns needed by any page to avoid multiple queries.
 */
export const getTrip = cache(async (tripId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trips')
    .select('id, name, status, cover_emoji, cover_image_url, start_date, end_date, created_by')
    .eq('id', tripId)
    .maybeSingle()
  return data
})
