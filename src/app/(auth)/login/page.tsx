import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { Icon } from '@/components/ui/icon'

// ── Typ-Alias für Sprite-Icon-Namen ──────────────────────────────────────────
type IconName = 'trip' | 'expense' | 'settle' | 'calendar' | 'cat-food' | 'balance' | 'group' | 'add' | 'paid'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const features: { icon: IconName; color: string; bg: string; title: string; desc: string }[] = [
    {
      icon: 'expense', color: '#F39200', bg: 'rgba(243,146,0,0.15)',
      title: 'Kosten gerecht teilen',
      desc: 'Ausgaben in Sekunden erfassen. Wer hat was bezahlt — share|pa rechnet alles automatisch auf.',
    },
    {
      icon: 'calendar', color: '#2AA8C9', bg: 'rgba(42,168,201,0.15)',
      title: 'Ausflüge planen & abstimmen',
      desc: 'Ideen sammeln, alle abstimmen lassen. Die beliebtesten Ausflüge landen automatisch im Kalender.',
    },
    {
      icon: 'cat-food', color: '#E94E1B', bg: 'rgba(233,78,27,0.15)',
      title: 'Essen planen',
      desc: 'Mahlzeiten für jeden Tag festlegen. Aus dem Plan wird automatisch eine Einkaufsliste.',
    },
    {
      icon: 'trip', color: '#3DB36A', bg: 'rgba(61,179,106,0.15)',
      title: 'Gemeinsame Packliste',
      desc: 'Was muss mit? Jeder sieht was schon gepackt ist. Nichts wird vergessen.',
    },
    {
      icon: 'balance', color: '#9B6FE0', bg: 'rgba(155,111,224,0.15)',
      title: 'Statistiken & Auswertungen',
      desc: 'Am Ende der Reise: wer hat wie viel ausgegeben, welche Kategorie war am teuersten?',
    },
    {
      icon: 'group', color: '#1b5c58', bg: 'rgba(27,92,88,0.25)',
      title: 'Gruppen & Familien',
      desc: 'Familie Müller, Familie Schmidt — jede Gruppe zahlt ihren eigenen Anteil, fair und transparent.',
    },
  ]

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)' }}
    >
      {/* ── Atmospheric glows ── */}
      <div className="absolute pointer-events-none" style={{
        top: '-5%', right: '-10%', width: '60vw', height: '60vw',
        maxWidth: 600, maxHeight: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,92,88,0.22) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: '20%', left: '-15%', width: '50vw', height: '50vw',
        maxWidth: 500, maxHeight: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(42,168,201,0.10) 0%, transparent 70%)',
        filter: 'blur(100px)',
      }} />

      {/* ── Nav ── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2 md:px-10">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sharepa-symbol-petrol.svg" alt="share|pa" className="w-7 h-7" />
          <span className="font-bold text-white/90 tracking-tight text-[15px]">
            share<span style={{ color: '#E94E1B' }}>|</span><span style={{ color: '#9AA0A6' }}>pa</span>
          </span>
        </div>
        <span className="text-[11px] font-medium text-white/25 tracking-widest uppercase hidden sm:block">
          Kostenlos · Kein App Store
        </span>
      </header>

      <main className="relative z-10 flex-1 px-5 md:px-10 pb-12">

        {/* ── Hero ── */}
        <div className="max-w-2xl mx-auto pt-10 pb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(27,92,88,0.25)', border: '1px solid rgba(27,92,88,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400/80">
              Die Reise-App für Gruppen
            </span>
          </div>

          <h1
            className="leading-[1.08] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800, color: '#f0ede6' }}
          >
            Alles für eure{' '}
            <span style={{
              background: 'linear-gradient(135deg, #1b5c58 0%, #2AA8C9 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Reisegruppe.
            </span>
            <br />
            <span style={{ color: 'rgba(240,237,230,0.55)' }}>An einem Ort.</span>
          </h1>

          <p className="text-[15px] leading-relaxed mb-8 max-w-lg mx-auto md:mx-0"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            Ausgaben teilen, Ausflüge abstimmen, Essen planen, Einkaufen organisieren —
            share|pa ist die Kommandozentrale für entspannte Gruppenreisen.
          </p>

          <div className="flex flex-col items-center md:items-start gap-3">
            <GoogleSignInButton />
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Kostenlos · Keine Kreditkarte · Sofort loslegen
            </p>
          </div>
        </div>

        {/* ── Feature-Grid ── */}
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Was share|pa kann
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-[18px] p-4 flex flex-col gap-2.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: f.bg, color: f.color }}
                >
                  <Icon name={f.icon} size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-bold leading-tight mb-1" style={{ color: '#f0ede6' }}>
                    {f.title}
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Mockup-Strip ── */}
          <div className="mt-8 rounded-[20px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MiniMockup />
          </div>
        </div>

      </main>

      <footer className="relative z-10 px-6 py-5 text-center">
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          © 2026 share|pa · Fair teilen. Entspannt reisen.
        </p>
      </footer>
    </div>
  )
}

/* ── Inline mini-mockup strip ─────────────────────────────────────────────── */
function MiniMockup() {
  const glass = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.09)',
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">

      {/* Saldo-Karte */}
      <div className="rounded-[14px] p-4" style={{
        background: 'linear-gradient(135deg, #1b5c58 0%, #144442 100%)',
        border: '1px solid rgba(27,92,88,0.5)',
      }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Dein Saldo
        </p>
        <p className="text-2xl font-extrabold text-white">+€ 34,50</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Du bekommst Geld zurück</p>
        <div className="grid grid-cols-3 gap-1 mt-3">
          {[['Gesamt', '€ 420'], ['Anteil', '€ 140'], ['Bezahlt', '€ 175']].map(([l, v]) => (
            <div key={l} className="rounded-lg p-1.5 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-[7px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</p>
              <p className="text-[10px] font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ausflüge / Abstimmung */}
      <div className="rounded-[14px] p-4 space-y-2" style={glass}>
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Ausflüge abstimmen
        </p>
        {[
          { emoji: '🏔️', title: 'Wanderung Tramuntana', yes: 4, total: 5 },
          { emoji: '🏖️', title: 'Strandtag Cala d\'Or', yes: 3, total: 5 },
          { emoji: '🍷', title: 'Weingut-Tour', yes: 5, total: 5 },
        ].map(a => (
          <div key={a.title} className="flex items-center gap-2">
            <span className="text-base flex-shrink-0">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.80)' }}>{a.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(a.yes / a.total) * 100}%`, background: '#3DB36A' }} />
                </div>
                <span className="text-[9px] font-bold" style={{ color: '#3DB36A' }}>{a.yes}/{a.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Essensplan */}
      <div className="rounded-[14px] p-4 space-y-2" style={glass}>
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Essensplan & Einkauf
        </p>
        {[
          { slot: 'Montag Abend', meal: 'Pasta Arrabiata', icon: '🍝' },
          { slot: 'Dienstag Mittag', meal: 'Tapas & Salat', icon: '🥗' },
          { slot: 'Dienstag Abend', meal: 'Grill am Strand', icon: '🔥' },
        ].map(m => (
          <div key={m.meal} className="flex items-center gap-2">
            <span className="text-base flex-shrink-0">{m.icon}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.80)' }}>{m.meal}</p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.slot}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>→</span>
          <p className="text-[10px] font-semibold" style={{ color: '#F39200' }}>Einkaufsliste: 14 Artikel</p>
        </div>
      </div>

    </div>
  )
}
