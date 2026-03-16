import { NextResponse } from 'next/server'

// Family-based API removed. This endpoint is no longer used.
// The new model uses trip_participants directly.
export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
