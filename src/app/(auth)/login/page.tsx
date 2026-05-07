import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { Icon } from '@/components/ui/icon'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
      background: 'linear-gradient(145deg, oklch(0.13 0.04 265) 0%, oklch(0.17 0.05 280) 40%, oklch(0.20 0.06 290) 100%)',
    }}>

      {/* ── Atmospheric background glows ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', right: '-5%',
          width: '55vw', height: '55vw',
          maxWidth: 700, maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.68 0.16 68 / 0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-5%', left: '-10%',
          width: '45vw', height: '45vw',
          maxWidth: 550, maxHeight: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.58 0.15 25 / 0.14) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Noise texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.70' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          opacity: 0.04,
        }}
      />

      {/* ── Top nav bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sharepa-symbol-petrol.svg" alt="share|pa" className="w-8 h-8" />
          <span className="font-bold text-white/90 tracking-tight">
            share<span style={{ color: '#E94E1B' }}>|</span><span style={{ color: '#9AA0A6' }}>pa</span>
          </span>
        </div>
        <div className="text-[12px] font-medium text-white/30 tracking-widest uppercase">
          Fair teilen
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-0">
          <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">

            {/* Left column: copy + CTA */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-white/50">
                  Kostenlos · Kein Stress
                </span>
              </div>

              <h1
                className="mb-6 leading-[1.05] tracking-tight"
                style={{
                  fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                  fontWeight: 800,
                  color: 'oklch(0.96 0.015 80)',
                }}
              >
                Fair{' '}
                <span style={{ color: '#2AA8C9' }}>
                  teilen.
                </span>
                <br />
                Entspannt reisen.
              </h1>

              {/* Subline */}
              <p className="text-base text-white/45 mb-9 max-w-md leading-relaxed">
                Verbinde deine Reisegruppe, erfasst Ausgaben in Sekunden und berechnet am Ende wer wem was schuldet — fair und stressfrei.
              </p>

              {/* CTA */}
              <div className="space-y-4">
                <GoogleSignInButton />

                {/* Social proof */}
                <p className="text-[11px] text-white/25 pl-1">
                  Keine Kreditkarte · Sofort loslegen
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mt-10">
                {[
                  { icon: 'trip' as const,    text: 'Reisen planen' },
                  { icon: 'expense' as const, text: 'Ausgaben teilen' },
                  { icon: 'settle' as const,  text: 'Fair abrechnen' },
                ].map(f => (
                  <div
                    key={f.text}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                    style={{
                      background: 'oklch(1 0 0 / 0.06)',
                      border: '1px solid oklch(1 0 0 / 0.08)',
                      color: 'oklch(1 0 0 / 0.55)',
                    }}
                  >
                    <Icon name={f.icon} size={13} />
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: app preview mockup */}
            <div className="hidden md:flex justify-center items-center">
              <div style={{ transform: 'rotate(2deg) translateY(-8px)' }}>
                <AppPreviewMockup />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Bottom bar ── */}
      <footer className="relative z-10 px-6 py-5 md:px-12 flex items-center justify-between">
        <p className="text-[11px] text-white/20">© 2026 share|pa</p>
        <p className="text-[11px] text-white/20">Fair teilen. Entspannt reisen.</p>
      </footer>

    </div>
  )
}

/* ── App preview as inline component ── */
function AppPreviewMockup() {
  return (
    <div className="w-72 space-y-3" style={{ filter: 'drop-shadow(0 24px 60px oklch(0 0 0 / 0.5))' }}>

      {/* Trip card */}
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{
        background: 'oklch(1 0 0 / 0.08)',
        border: '1px solid oklch(1 0 0 / 0.10)',
        backdropFilter: 'blur(20px)',
      }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'oklch(0.68 0.16 68 / 0.20)' }}>
          🌴
        </div>
        <div className="flex-1">
          <p className="text-white/90 font-semibold text-sm">Mallorca 2025</p>
          <p className="text-white/40 text-xs">3 Gruppen · Aktiv</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: 'oklch(0.58 0.18 160 / 0.2)', color: 'oklch(0.70 0.15 160)' }}>
          Aktiv
        </span>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-5" style={{
        background: 'linear-gradient(135deg, oklch(0.68 0.16 68 / 0.90) 0%, oklch(0.62 0.18 52 / 0.90) 100%)',
        border: '1px solid oklch(0.68 0.16 68 / 0.3)',
        backdropFilter: 'blur(20px)',
      }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: 'oklch(0.14 0.03 50 / 0.60)' }}>
          Dein Saldo
        </p>
        <p className="text-3xl font-extrabold tracking-tight mb-0.5"
          style={{ color: 'oklch(0.14 0.03 50)' }}>
          +€ 34,50
        </p>
        <p className="text-xs" style={{ color: 'oklch(0.14 0.03 50 / 0.55)' }}>
          🎉 Du bekommst Geld zurück
        </p>
        <div className="grid grid-cols-3 gap-1.5 mt-4">
          {[['Gesamt', '€ 420'], ['Dein Anteil', '€ 140'], ['Bezahlt', '€ 174,50']].map(([l, v]) => (
            <div key={l} className="rounded-xl p-2 text-center"
              style={{ background: 'oklch(0.14 0.03 50 / 0.12)' }}>
              <p className="text-[8px] uppercase tracking-wide mb-0.5"
                style={{ color: 'oklch(0.14 0.03 50 / 0.45)' }}>{l}</p>
              <p className="text-[11px] font-bold"
                style={{ color: 'oklch(0.14 0.03 50)' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expense items */}
      {[
        { emoji: '🍽️', title: 'Abendessen', by: 'Familie Müller', amount: '€ 89,00' },
        { emoji: '🏨', title: 'Hotel Nacht 2', by: 'Familie Schmidt', amount: '€ 210,00' },
      ].map(e => (
        <div key={e.title} className="rounded-2xl p-3.5 flex items-center gap-3" style={{
          background: 'oklch(1 0 0 / 0.06)',
          border: '1px solid oklch(1 0 0 / 0.08)',
          backdropFilter: 'blur(16px)',
        }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'oklch(1 0 0 / 0.08)' }}>
            {e.emoji}
          </div>
          <div className="flex-1">
            <p className="text-white/85 text-xs font-semibold">{e.title}</p>
            <p className="text-white/35 text-[10px]">{e.by}</p>
          </div>
          <p className="text-white/75 text-xs font-bold">{e.amount}</p>
        </div>
      ))}

    </div>
  )
}
