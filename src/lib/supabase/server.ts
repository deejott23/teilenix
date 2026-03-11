import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Note: Until Supabase types are auto-generated with `supabase gen types typescript`,
// we use `any` to avoid false type errors. Explicit casts are used where needed.
export async function createClient() {
  const cookieStore = await cookies()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies – safe to ignore
          }
        },
      },
    }
  )
}
