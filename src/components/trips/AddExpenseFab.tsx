'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

interface AddExpenseFabProps {
  tripId: string
}

export default function AddExpenseFab({ tripId }: AddExpenseFabProps) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`
  const rel = pathname.slice(base.length) // e.g. '' | '/expenses' | '/planen' | …

  // Show ONLY on: Home ('') and Geld-section (/expenses, /stats, /settlement)
  // but never on the "new expense" form itself
  const show =
    rel === '' ||
    (rel.startsWith('/expenses') && rel !== '/expenses/new') ||
    rel.startsWith('/stats') ||
    rel.startsWith('/settlement')

  if (!show) return null

  return (
    <Link
      href={`/trips/${tripId}/expenses/new`}
      className="fixed bottom-[84px] right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 py-3.5 rounded-2xl hover:bg-primary/90 active:scale-95 transition-all font-semibold text-[14px]"
      style={{ boxShadow: '0 4px 12px rgba(30,111,217,.3), 0 12px 24px rgba(30,111,217,.2)' }}
      aria-label="Ausgabe hinzufügen"
    >
      <Icon name="add" size={20} />
      Ausgabe
    </Link>
  )
}
