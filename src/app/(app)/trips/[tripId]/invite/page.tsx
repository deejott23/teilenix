import { redirect } from 'next/navigation'

// The invite/settings tab has been replaced by the participants tab
export default async function TripInviteRedirectPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  redirect(`/trips/${tripId}/participants`)
}
