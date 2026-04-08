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
    <div className="flex gap-1.5 mb-5 bg-muted p-1 rounded-[14px]">
      {tabs.map(tab => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 py-2 text-center text-[12px] font-bold rounded-[10px] transition-all',
              isActive
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
