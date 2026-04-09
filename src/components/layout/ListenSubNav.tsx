'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { List, ShoppingCart } from 'lucide-react'

export default function ListenSubNav({ tripId }: { tripId: string }) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  const tabs = [
    { href: `${base}/packlist`, label: 'Packliste', icon: List, match: `${base}/packlist` },
    { href: `${base}/einkauf`, label: 'Einkaufszettel', icon: ShoppingCart, match: `${base}/einkauf` },
  ]

  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(({ href, label, icon: Icon, match }) => {
        const isActive = pathname.startsWith(match)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all',
              isActive
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.2 : 1.7} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
