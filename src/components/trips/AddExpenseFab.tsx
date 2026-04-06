'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

interface AddExpenseFabProps {
  tripId: string
}

const HIDDEN_ON = ['/expenses/new', '/expenses', '/stats', '/settlement', '/packlist']

export default function AddExpenseFab({ tripId }: AddExpenseFabProps) {
  const pathname = usePathname()

  if (HIDDEN_ON.some(suffix => pathname.endsWith(suffix))) return null

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
