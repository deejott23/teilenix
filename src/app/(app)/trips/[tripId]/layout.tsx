import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getUser } from '@/lib/supabase/user'
import { getTrip } from '@/lib/supabase/trips'
import TripBottomNav from '@/components/layout/TripBottomNav'
import AddExpenseFab from '@/components/trips/AddExpenseFab'
import TripEmojiPicker from '@/components/trips/TripEmojiPicker'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import TripBackButton from '@/components/layout/TripBackButton'
import Image from 'next/image'
import { pickFallbackEmoji } from '@/lib/tripEmojis'
import { formatDate } from '@/lib/formatting'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  // getUser() is cached — no extra network call (shared with AppLayout)
  const user = await getUser()
  const supabase = await createClient()

  // Fetch trip data and participant status in parallel (trip is cached with React cache())
  const [trip, { data: myParticipant }] = await Promise.all([
    getTrip(tripId),
    supabase
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  if (!trip) notFound()

  const isActive = trip.status === 'active'
  const showPacklist = (trip.show_packlist as boolean | null) ?? false

  const showFacts = false
  const coverEmoji = (trip.cover_emoji as string | null) ?? pickFallbackEmoji(trip.name as string)
  const coverImageUrl = (trip.cover_image_url as string | null) ?? null
  const isParticipant = !!myParticipant

  const dateRange = trip.start_date && trip.end_date
    ? `${formatDate(trip.start_date as string)} – ${formatDate(trip.end_date as string)}`
    : trip.start_date ? `ab ${formatDate(trip.start_date as string)}` : null

  return (
    <div>
      {/* Header strip — NO overflow-hidden so emoji picker popover is visible */}
      <div
        className="-mx-4 -mt-7 mb-5 px-4 pt-7 pb-4 rounded-b-3xl relative"
        style={{ background: 'linear-gradient(150deg, #1E6FD9 0%, #1859B5 100%)' }}
      >
        {/* Cover image background */}
        {coverImageUrl && (
          <div className="absolute inset-0 rounded-b-3xl overflow-hidden pointer-events-none">
            <Image src={coverImageUrl} alt="" fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-0" style={{ background: 'rgba(13,30,27,0.65)' }} />
          </div>
        )}

        {/* Big background emoji (only when no cover image) */}
        {!coverImageUrl && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[72px] leading-none select-none pointer-events-none"
            style={{ opacity: 0.15, filter: 'blur(1px)' }}
            aria-hidden
          >
            {coverEmoji}
          </span>
        )}

        <div className="flex items-center gap-2.5 relative">
          {/* Back button — Dashboard → /trips, sonst → Trip-Dashboard */}
          <TripBackButton tripId={tripId} />

          {/* Emoji badge */}
          <TripEmojiPicker
            tripId={tripId}
            currentEmoji={coverEmoji}
            currentImageUrl={coverImageUrl}
            canEdit={isParticipant}
          />

          {/* Trip name + date */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-bold text-white truncate leading-tight">{trip.name as string}</h1>
            {dateRange && (
              <p className="text-[11px] text-white/60 mt-0.5 leading-tight">{dateRange}</p>
            )}
          </div>

          {/* Settings gear */}
          <Link
            href={`/trips/${tripId}/participants`}
            className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            <Settings className="w-4 h-4" strokeWidth={1.8} />
            {!isActive && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div>
        {children}
      </div>

      {isActive && <AddExpenseFab tripId={tripId} />}

      <TripBottomNav tripId={tripId} isEnded={!isActive} showFacts={showFacts} showPacklist={showPacklist} />
    </div>
  )
}
