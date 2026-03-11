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

  const tabs = [
    { href: base, label: 'Übersicht', exact: true },
    { href: `${base}/expenses`, label: 'Ausgaben', exact: false },
    { href: `${base}/stats`, label: 'Statistiken', exact: false },
    { href: `${base}/settlement`, label: 'Abrechnung', exact: false },
  ]

  return (
    <nav className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
      {tabs.map(tab => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {tab.href.includes('settlement') && isEnded && (
              <span className="ml-1.5 inline-flex items-center justify-center w-2 h-2 bg-primary rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
