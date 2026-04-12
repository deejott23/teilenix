'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function GeldSubNav({ tripId }: { tripId: string }) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  const tabs = [
    { href: `${base}/expenses`,   label: 'Ausgaben'    },
    { href: `${base}/settlement`, label: 'Abrechnung'  },
    { href: `${base}/stats`,      label: 'Statistiken' },
  ]

  return (
    <div
      className="flex gap-1.5 mb-5 p-1 rounded-[14px]"
      style={{ background: 'oklch(0.52 0.15 78 / 0.10)' }}
    >
      {tabs.map(tab => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 py-2 text-center text-[12px] font-bold rounded-[10px] transition-all',
              !isActive && 'text-muted-foreground hover:text-foreground'
            )}
            style={isActive ? { background: 'var(--section-geld)', color: 'white' } : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
