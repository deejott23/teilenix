'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function TripBackButton({ tripId }: { tripId: string }) {
  const pathname = usePathname()
  const isDashboard = pathname === `/trips/${tripId}`
  const backHref = isDashboard ? '/trips' : `/trips/${tripId}`

  return (
    <Link
      href={backHref}
      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
    >
      <ChevronLeft className="w-5 h-5" strokeWidth={2} />
    </Link>
  )
}
