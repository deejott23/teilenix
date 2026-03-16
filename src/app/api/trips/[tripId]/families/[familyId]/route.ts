import { NextResponse } from 'next/server'

// This endpoint is deprecated. The family model has been replaced by trip_participants.
export async function PATCH() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
