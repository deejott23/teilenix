'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

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
      className="fixed bottom-[84px] right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 py-3.5 rounded-2xl shadow-lg shadow-primary/35 hover:bg-primary/90 active:scale-95 transition-all font-semibold text-[14px]"
      aria-label="Ausgabe hinzufügen"
    >
      <Plus className="w-5 h-5" strokeWidth={2.5} />
      Ausgabe
    </Link>
  )
}
