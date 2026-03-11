import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TripTabNav from '@/components/layout/TripTabNav'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('id, name, status')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Link href="/dashboard" className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">{trip.name as string}</h1>
      </div>
      <TripTabNav tripId={tripId} isEnded={trip.status === 'ended'} />
      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}
