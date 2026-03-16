'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TripTabNavProps {
  tripId: string
  isEnded: boolean
}

export default function TripTabNav({ tripId, isEnded }: TripTabNavProps) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  const tabs: { href: string; label: string; exact: boolean; dot?: boolean; hidden?: boolean }[] = [
    { href: base,                   label: 'Übersicht',   exact: true  },
    { href: `${base}/expenses`,     label: 'Ausgaben',    exact: false },
    { href: `${base}/stats`,        label: 'Statistiken', exact: false },
    { href: `${base}/settlement`,   label: 'Abrechnung',  exact: false, dot: isEnded },
    { href: `${base}/participants`, label: 'Einstellungen', exact: false },
  ]

  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      {tabs.filter(t => !t.hidden).map(tab => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {tab.label}
            {tab.dot && (
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isActive ? 'bg-white/70' : 'bg-primary')} />
            )}
          </Link>
        )
      })}
    </div>
  )
}
