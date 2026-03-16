import { NextResponse } from 'next/server'

// Family join endpoint removed. Use /api/trips/[tripId]/join instead.
export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
