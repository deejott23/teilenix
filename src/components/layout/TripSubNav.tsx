'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = { href: string; label: string }

export default function TripSubNav({ tripId, tabs }: { tripId: string; tabs: Tab[] }) {
  const pathname = usePathname()
  return (
    <div className="flex gap-1.5 mb-4 bg-muted p-1 rounded-[14px]">
      {tabs.map(({ href, label }) => {
        const full = `/trips/${tripId}${href}`
        const isActive = pathname === full || pathname.startsWith(full + '/')
        return (
          <Link
            key={href}
            href={full}
            className={cn(
              'flex-1 py-2 text-center text-[12px] font-bold rounded-[10px] transition-all',
              isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
