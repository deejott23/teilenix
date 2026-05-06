import { cache } from 'react'
import { createClient } from './server'

/**
 * Cached getUser — deduplicates the Supabase auth network call across layout + page
 * within the same request using React's per-request cache().
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
