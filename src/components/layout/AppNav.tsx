'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plane, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppNavProps {
  userId: string
  needsOnboarding: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/trips', label: 'Reisen', icon: Plane },
  { href: '/family', label: 'Familie', icon: Users },
  { href: '/profile', label: 'Profil', icon: User },
]

export default function AppNav({ needsOnboarding }: AppNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.href === '/family' && needsOnboarding && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:w-64 md:flex md:flex-col bg-white border-r border-gray-200 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">TeileniX</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.href === '/family' && needsOnboarding && (
                  <span className="ml-auto w-2 h-2 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
