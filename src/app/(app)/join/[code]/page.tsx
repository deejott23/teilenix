import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinTripClient from './JoinTripClient'

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${code}`)
  }

  // Validate code length before hitting DB
  const cleanCode = code.trim().toUpperCase()
  if (cleanCode.length < 4 || cleanCode.length > 16 || !/^[A-Z0-9]+$/.test(cleanCode)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">🤔</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Einladung nicht gefunden</h1>
        <p className="text-muted-foreground text-sm">Der Einladungscode ist ungültig oder abgelaufen.</p>
      </div>
    )
  }

  // Use admin client to bypass RLS — user is not a trip member yet
  const admin = createAdminClient()
  const { data: tripRow } = await admin
    .from('trips')
    .select('id, name, status')
    .ilike('invite_code', cleanCode)
    .maybeSingle()

  const participantCount = tripRow
    ? (await admin.from('trip_participants').select('id', { count: 'exact', head: true }).eq('trip_id', tripRow.id)).count ?? 0
    : 0

  const trip = tripRow ? { ...tripRow, participant_count: participantCount } : null

  if (!trip) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">🤔</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Einladung nicht gefunden</h1>
        <p className="text-muted-foreground text-sm">Der Einladungscode ist ungültig oder abgelaufen.</p>
      </div>
    )
  }

  if (trip.status === 'ended') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">🏁</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Reise beendet</h1>
        <p className="text-muted-foreground text-sm">Diese Reise wurde bereits abgeschlossen.</p>
      </div>
    )
  }

  // Check if already joined
  const { data: existingParticipant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', trip.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const alreadyJoined = existingParticipant !== null

  return (
    <JoinTripClient
      trip={trip}
      alreadyJoined={alreadyJoined}
    />
  )
}
