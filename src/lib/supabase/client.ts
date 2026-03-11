import { createBrowserClient } from '@supabase/ssr'

// Note: Until Supabase types are auto-generated with `supabase gen types typescript`,
// we use `any` to avoid false type errors. Explicit casts are used where needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
