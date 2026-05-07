'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon as SpriteIcon } from '@/components/ui/icon'
import { queryKeys } from '@/lib/query/queryKeys'
import { fetchers } from '@/lib/query/fetchers'

interface TripBottomNavProps {
  tripId: string
  isEnded: boolean
  showFacts?: boolean
}

export default function TripBottomNav({ tripId, isEnded, showFacts = false }: TripBottomNavProps) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const base = `/trips/${tripId}`

  const prefetch = (keys: (() => void)[]) => () => keys.forEach(fn => fn())

  const prefetchExpenses = () =>
    queryClient.prefetchQuery({ queryKey: queryKeys.expenses.withSplits(tripId), queryFn: () => fetchers.expenses(tripId), staleTime: 30_000 })

  const prefetchLists = () => {
    queryClient.prefetchQuery({ queryKey: queryKeys.packlist.byTrip(tripId), queryFn: () => fetchers.packlist(tripId), staleTime: 30_000 })
    queryClient.prefetchQuery({ queryKey: queryKeys.shopping.byTrip(tripId), queryFn: () => fetchers.shopping(tripId), staleTime: 30_000 })
  }

  const prefetchPlanen = () => {
    queryClient.prefetchQuery({ queryKey: queryKeys.activities.byTrip(tripId), queryFn: () => fetchers.activities(tripId), staleTime: 30_000 })
    queryClient.prefetchQuery({ queryKey: queryKeys.meals.byTrip(tripId), queryFn: () => fetchers.meals(tripId), staleTime: 30_000 })
  }

  type LucideComp = React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  const tabs = [
    {
      href: base,
      label: 'Home',
      spriteName: 'trip' as string | undefined,
      icon: undefined as LucideComp | undefined,
      isActive: pathname === base,
      color: { fg: 'var(--section-listen)', bg: 'var(--section-listen-muted)' },
      onPrefetch: undefined as (() => void) | undefined,
    },
    {
      href: `${base}/expenses`,
      label: 'Geld',
      spriteName: 'expense' as string | undefined,
      icon: undefined as LucideComp | undefined,
      isActive:
        pathname.startsWith(`${base}/expenses`) ||
        pathname.startsWith(`${base}/stats`) ||
        pathname.startsWith(`${base}/settlement`),
      dot: isEnded,
      color: { fg: 'var(--section-geld)', bg: 'var(--section-geld-muted)' },
      onPrefetch: prefetchExpenses as (() => void) | undefined,
    },
    {
      href: `${base}/planen`,
      label: 'Planen',
      spriteName: 'calendar' as string | undefined,
      icon: undefined as LucideComp | undefined,
      isActive: pathname.startsWith(`${base}/planen`) || pathname.startsWith(`${base}/essen`),
      color: { fg: 'var(--section-planen)', bg: 'var(--section-planen-muted)' },
      onPrefetch: prefetchPlanen as (() => void) | undefined,
    },
    {
      href: `${base}/packlist`,
      label: 'Listen',
      spriteName: undefined as string | undefined,
      icon: ClipboardList as LucideComp,
      isActive: pathname.startsWith(`${base}/packlist`) || pathname.startsWith(`${base}/einkauf`) || pathname.startsWith(`${base}/listen`),
      color: { fg: 'var(--section-listen)', bg: 'var(--section-listen-muted)' },
      onPrefetch: prefetchLists as (() => void) | undefined,
    },
    {
      href: `${base}/facts`,
      label: 'ReiseBlatt',
      spriteName: undefined as string | undefined,
      icon: Newspaper as LucideComp,
      isActive: pathname.startsWith(`${base}/facts`),
      color: { fg: 'var(--section-facts)', bg: 'var(--section-facts-muted)' },
      onPrefetch: undefined as (() => void) | undefined,
    },
  ].filter(tab => tab.href !== `${base}/facts` || showFacts)

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {tabs.map(({ href, label, spriteName, icon: LucideIcon, isActive, dot, color, onPrefetch }) => (
            <Link
              key={href}
              href={href}
              onTouchStart={onPrefetch}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl active:scale-90 transition-transform duration-100"
            >
              <div
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                style={isActive ? { background: color.bg } : undefined}
              >
                {spriteName
                  ? <SpriteIcon name={spriteName} size={18} className={cn('transition-colors', !isActive && 'text-muted-foreground')} style={isActive ? { color: color.fg } : undefined} />
                  : LucideIcon && <LucideIcon className={cn('w-[18px] h-[18px] transition-colors', !isActive && 'text-muted-foreground')} style={isActive ? { color: color.fg } : undefined} strokeWidth={isActive ? 2.2 : 1.7} />
                }
                {dot && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-card" />
                )}
              </div>
              <span
                className={cn('text-[10px] font-bold tracking-wide transition-colors', !isActive && 'text-muted-foreground')}
                style={isActive ? { color: color.fg } : undefined}
              >
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
            onMouseEnter={tab.onPrefetch}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap',
              tab.isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            style={tab.isActive ? { background: tab.color.fg } : undefined}
          >
            {tab.spriteName
              ? <SpriteIcon name={tab.spriteName} size={16} />
              : tab.icon && <tab.icon className="w-4 h-4" strokeWidth={tab.isActive ? 2.2 : 1.7} />
            }
            {tab.label}
            {tab.dot && !tab.isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
          </Link>
        ))}
      </nav>
    </>
  )
}
