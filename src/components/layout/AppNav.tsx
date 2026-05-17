'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { APP_VERSION, CHANGELOG } from '@/lib/version'
import { useState } from 'react'

interface AppNavProps {
  userId: string
  needsOnboarding: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Reisen',  spriteName: 'trip' as string | undefined,  icon: undefined as React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }> | undefined },
  { href: '/profile',   label: 'Profil',  spriteName: 'user',   icon: undefined },
  { href: '/help',      label: 'Hilfe',   spriteName: undefined, icon: HelpCircle as React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }> },
]

export default function AppNav({ needsOnboarding }: AppNavProps) {
  const pathname = usePathname()
  const [showChangelog, setShowChangelog] = useState(false)

  // Trip pages have their own bottom nav
  const isOnTripPage = pathname.startsWith('/trips/')

  return (
    <>
      {/* ── Mobile bottom bar ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border${isOnTripPage ? ' hidden' : ''}`}>
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navItems.map(({ href, label, spriteName, icon: LucideIcon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-colors active:scale-90 transition-transform duration-100"
              >
                <div className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-xl transition-colors',
                  active ? 'bg-primary' : 'bg-transparent'
                )}>
                  {spriteName
                    ? <Icon name={spriteName} size={18} className={cn('transition-colors', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
                    : LucideIcon && <LucideIcon className={cn('w-4.5 h-4.5 transition-colors', active ? 'text-primary-foreground' : 'text-muted-foreground')} strokeWidth={active ? 2.2 : 1.7} />
                  }
                </div>
                <span className={cn('text-[10px] font-bold tracking-wide transition-colors', active ? 'text-primary' : 'text-muted-foreground')}>
                  {label}
                </span>
                {href === '/profile' && needsOnboarding && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex md:flex-col bg-card border-r border-border z-40">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-border flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sharepa-symbol-petrol.svg" alt="" className="w-7 h-7" />
          <span className="font-bold text-foreground tracking-tight">
            share<span style={{ color: '#E94E1B' }}>|</span><span style={{ color: '#9AA0A6' }}>pa</span>
          </span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, spriteName, icon: LucideIcon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {spriteName
                  ? <Icon name={spriteName} size={18} />
                  : LucideIcon && <LucideIcon className="w-4.5 h-4.5" strokeWidth={active ? 2.2 : 1.8} />
                }
                {label}
                {href === '/profile' && needsOnboarding && (
                  <span className="ml-auto w-2 h-2 bg-destructive rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={() => setShowChangelog(true)}
            className="text-[11px] text-muted-foreground/40 font-medium hover:text-muted-foreground transition-colors"
          >
            share|pa v{APP_VERSION}
          </button>
        </div>
      </aside>

      {/* ── Changelog dialog ── */}
      {showChangelog && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChangelog(false)} />
          <div className="relative bg-card rounded-t-[24px] md:rounded-[20px] w-full max-w-sm mx-auto shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <div>
                <p className="text-[15px] font-bold text-foreground">Release Notes</p>
                <p className="text-[12px] text-muted-foreground">share|pa v{APP_VERSION}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowChangelog(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-5">
              {CHANGELOG.map(entry => (
                <div key={entry.version}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-bold text-foreground">v{entry.version}</span>
                    <span className="text-[11px] text-muted-foreground">{entry.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.changes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                        <span className="text-primary font-bold mt-0.5">·</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
