'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, ClipboardList, MessageCircle, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TripBottomNavProps {
  tripId: string
  isEnded: boolean
}

export default function TripBottomNav({ tripId, isEnded }: TripBottomNavProps) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  const tabs = [
    {
      href: base,
      label: 'Home',
      icon: Home,
      isActive: pathname === base,
    },
    {
      href: `${base}/planen`,
      label: 'Planen',
      icon: Calendar,
      isActive: pathname.startsWith(`${base}/planen`) || pathname.startsWith(`${base}/essen`),
    },
    {
      href: `${base}/packlist`,
      label: 'Listen',
      icon: ClipboardList,
      isActive: pathname.startsWith(`${base}/packlist`) || pathname.startsWith(`${base}/einkauf`) || pathname.startsWith(`${base}/listen`),
    },
    {
      href: `${base}/gruppe`,
      label: 'Gruppe',
      icon: MessageCircle,
      isActive: pathname.startsWith(`${base}/gruppe`),
    },
    {
      href: `${base}/expenses`,
      label: 'Geld',
      icon: Wallet,
      isActive:
        pathname.startsWith(`${base}/expenses`) ||
        pathname.startsWith(`${base}/stats`) ||
        pathname.startsWith(`${base}/settlement`),
      dot: isEnded,
    },
  ]

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {tabs.map(({ href, label, icon: Icon, isActive, dot }) => (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-colors active:scale-90 transition-transform duration-100"
            >
              <div className={cn(
                'w-8 h-8 flex items-center justify-center rounded-xl transition-colors',
                isActive ? 'bg-primary' : 'bg-transparent'
              )}>
                <Icon
                  className={cn('w-[18px] h-[18px] transition-colors', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                {dot && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-card" />
                )}
              </div>
              <span className={cn('text-[10px] font-bold tracking-wide transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop horizontal strip */}
      <nav className="hidden md:flex gap-1 overflow-x-auto scrollbar-none pb-0.5 mb-5">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap',
              tab.isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-4 h-4" strokeWidth={tab.isActive ? 2.2 : 1.7} />
            {tab.label}
            {tab.dot && !tab.isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
          </Link>
        ))}
      </nav>
    </>
  )
}
