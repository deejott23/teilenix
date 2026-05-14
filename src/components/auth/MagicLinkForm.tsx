'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard'
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    setLoading(false)
    if (error) {
      setError(error.message || 'E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div
        className="w-full rounded-2xl px-5 py-4 text-center"
        style={{
          background: 'rgba(61,179,106,0.12)',
          border: '1px solid rgba(61,179,106,0.3)',
        }}
      >
        <p className="text-[14px] font-semibold" style={{ color: '#3DB36A' }}>
          Link verschickt!
        </p>
        <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Schau in dein E-Mail-Postfach und klick den Link.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="deine@email.de"
        required
        className="w-full rounded-xl px-4 text-[15px] outline-none transition-all"
        style={{
          height: 48,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#f0ede6',
        }}
        onFocus={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.3)')}
        onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)')}
      />
      {error && (
        <p className="text-[12px] px-1" style={{ color: '#E94E1B' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full rounded-2xl font-semibold text-[15px] transition-all duration-200 disabled:opacity-50"
        style={{
          height: 48,
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {loading ? 'Wird gesendet…' : 'Magic Link senden'}
      </button>
    </form>
  )
}
