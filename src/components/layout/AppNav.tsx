'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, UserCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppNavProps {
  userId: string
  needsOnboarding: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Reisen',  icon: Plane       },
  { href: '/profile',   label: 'Profil',  icon: UserCircle  },
  { href: '/help',      label: 'Hilfe',   icon: HelpCircle  },
]

export default function AppNav({ needsOnboarding }: AppNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* ── Mobile bottom bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
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
                  <Icon
                    className={cn('w-4.5 h-4.5 transition-colors', active ? 'text-primary-foreground' : 'text-muted-foreground')}
                    strokeWidth={active ? 2.2 : 1.7}
                  />
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
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="font-bold text-foreground tracking-tight">TeileniX</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
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
                <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
                {href === '/profile' && needsOnboarding && (
                  <span className="ml-auto w-2 h-2 bg-destructive rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground/40 font-medium">TeileniX v1.0</p>
        </div>
      </aside>
    </>
  )
}
