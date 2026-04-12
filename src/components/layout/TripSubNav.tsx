'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = { href: string; label: string }
type Variant = 'planen' | 'listen'

const variantTokens: Record<Variant, { fg: string; bg: string; track: string }> = {
  planen: {
    fg:    'var(--section-planen)',
    bg:    'var(--section-planen-muted)',
    track: 'oklch(0.44 0.22 264 / 0.10)',
  },
  listen: {
    fg:    'var(--section-listen)',
    bg:    'var(--section-listen-muted)',
    track: 'oklch(0.40 0.09 188 / 0.10)',
  },
}

export default function TripSubNav({ tripId, tabs, variant = 'planen' }: { tripId: string; tabs: Tab[]; variant?: Variant }) {
  const pathname = usePathname()
  const tokens = variantTokens[variant]
  return (
    <div
      className="flex gap-1.5 mb-4 p-1 rounded-[14px]"
      style={{ background: tokens.track }}
    >
      {tabs.map(({ href, label }) => {
        const full = `/trips/${tripId}${href}`
        const isActive = pathname === full || pathname.startsWith(full + '/')
        return (
          <Link
            key={href}
            href={full}
            className={cn(
              'flex-1 py-2 text-center text-[12px] font-bold rounded-[10px] transition-all',
              !isActive && 'text-muted-foreground hover:text-foreground'
            )}
            style={isActive ? { background: tokens.fg, color: 'white' } : undefined}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
