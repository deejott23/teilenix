import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard', '/trips', '/profile', '/family',
  '/help', '/join', '/onboarding', '/settlement',
]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Fast session check — reads JWT from cookie, no Supabase network call
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Root: redirect based on session
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(session ? '/dashboard' : '/login', request.url)
    )
  }

  // Protected routes: require session
  if (PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Login page: redirect logged-in users away
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|icons|manifest\\.json|sw\\.js|apple-touch-icon).*)'],
}
