import { createClient } from '@/lib/supabase/server'
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

  // Find trip by invite code
  const { data: trip } = await supabase
    .from('trips')
    .select('id, name, description, status, start_date, end_date')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle()

  if (!trip) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">🤔</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Einladung nicht gefunden</h1>
        <p className="text-gray-500 text-sm">Der Einladungscode ist ungültig oder abgelaufen.</p>
      </div>
    )
  }

  if (trip.status === 'ended') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">🏁</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Reise beendet</h1>
        <p className="text-gray-500 text-sm">Diese Reise wurde bereits abgeschlossen.</p>
      </div>
    )
  }

  // Check if user has a family
  const { data: memberData } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let familyMember: { family_id: string; families: { name: string; default_shares: number } | null } | null = null

  if (memberData) {
    const { data: famData } = await supabase
      .from('families')
      .select('name, default_shares')
      .eq('id', memberData.family_id)
      .single()

    familyMember = {
      family_id: memberData.family_id as string,
      families: famData as { name: string; default_shares: number } | null,
    }
  }

  // Check if already joined
  const alreadyJoined = memberData
    ? (await supabase
        .from('trip_families')
        .select('id')
        .eq('trip_id', trip.id)
        .eq('family_id', memberData.family_id)
        .maybeSingle()
      ).data !== null
    : false

  return (
    <JoinTripClient
      trip={trip}
      familyMember={familyMember}
      alreadyJoined={alreadyJoined}
    />
  )
}
