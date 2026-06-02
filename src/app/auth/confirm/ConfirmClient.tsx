'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { EmailOtpType } from '@supabase/supabase-js'

export default function ConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code       = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type       = (searchParams.get('type') ?? 'email') as EmailOtpType
    const rawNext    = searchParams.get('next') ?? '/dashboard'
    const next       = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

    const supabase = createClient()

    async function confirm() {
      // token_hash flow: Supabase email template sends token_hash directly to the app.
      // This is the preferred approach – email scanners load this page (HTML only, no JS
      // execution) so the token stays intact until the real user's browser runs this code.
      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) { setError(error.message); return }
        router.replace(next)
        return
      }

      // code flow: PKCE – used by Google OAuth and as fallback for magic links.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setError(error.message); return }
        router.replace(next)
        return
      }

      setError('Ungültiger Link – kein Token gefunden.')
    }

    confirm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h1 style={{ color: '#f0ede6', fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>
            Link abgelaufen
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Der Link ist abgelaufen oder wurde bereits verwendet.
            Fordere einen neuen an.
          </p>
          <a
            href="/login"
            style={{
              display: 'block',
              padding: '12px 0',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.09)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)',
              textDecoration: 'none',
            }}
          >
            Neuen Link anfordern
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)',
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Anmeldung wird abgeschlossen…</p>
    </div>
  )
}
