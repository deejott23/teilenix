'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  useEffect(() => {
    if (!code) {
      setErrorMsg('Kein Code im Link gefunden. Bitte fordere einen neuen Link an.')
      setState('error')
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setErrorMsg(
          'Der Link ist abgelaufen oder wurde bereits verwendet. ' +
          'Öffne den Link auf demselben Gerät und im gleichen Browser, ' +
          'in dem du ihn angefordert hast – oder fordere einen neuen an.'
        )
        setState('error')
        return
      }
      router.replace(next)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)' }}
      >
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-[40px]">⚠️</div>
          <h1 className="text-[20px] font-bold" style={{ color: '#f0ede6' }}>Link abgelaufen</h1>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {errorMsg}
          </p>
          <a
            href="/login"
            className="block w-full py-3 rounded-[14px] font-bold text-[15px] text-center"
            style={{
              background: 'rgba(255,255,255,0.09)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)',
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
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)' }}
    >
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-[40px]">✨</div>
        <h1 className="text-[20px] font-bold" style={{ color: '#f0ede6' }}>Einloggen…</h1>
        <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Einen Moment bitte.</p>
        <div className="flex justify-center pt-2">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.7)' }} />
        </div>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  )
}
