import { redirect } from 'next/navigation'

// /trips redirects to dashboard which shows all trips
export default function TripsPage() {
  redirect('/dashboard')
}
