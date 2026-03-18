import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TripTabNav from '@/components/layout/TripTabNav'
import AddExpenseFab from '@/components/trips/AddExpenseFab'
import TripEmojiPicker from '@/components/trips/TripEmojiPicker'
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
    .select('*')
    .eq('id', tripId)
    .maybeSingle()

  if (!trip) notFound()

  const isActive = trip.status === 'active'
  const coverEmoji = (trip.cover_emoji as string | null) ?? null
  const isCreator = trip.created_by === user.id

  return (
    <div>
      {/* Teal header with large decorative emoji */}
      <div
        className="-mx-4 -mt-7 mb-5 px-5 pt-8 pb-5 rounded-b-3xl relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #1b5c58 0%, #134844 100%)' }}
      >
        {/* Big background emoji */}
        {coverEmoji && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[80px] leading-none select-none pointer-events-none"
            style={{ opacity: 0.18, filter: 'blur(1px)' }}
            aria-hidden
          >
            {coverEmoji}
          </span>
        )}

        <div className="flex items-center gap-3 relative">
          <Link
            href="/dashboard"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </Link>

          {/* Emoji badge — tappable to change */}
          <TripEmojiPicker
            tripId={tripId}
            currentEmoji={coverEmoji ?? '🌍'}
            canEdit={isCreator}
          />

          <h1 className="text-[18px] font-bold text-white truncate flex-1">{trip.name as string}</h1>
          <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{
            background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
          }}>
            {isActive ? '● Aktiv' : 'Fertig'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <TripTabNav tripId={tripId} isEnded={!isActive} />

      {/* Content */}
      <div className="mt-5">
        {children}
      </div>

      {isActive && <AddExpenseFab tripId={tripId} />}
    </div>
  )
}
