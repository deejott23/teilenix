import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { computeSettlement } from '@/lib/settlement'
import type { ExpenseWithSplits, TripFamilyWithFamily } from '@/types/app'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Fetch trip families
  const { data: tripFamilies, error: familiesError } = await supabase
    .from('trip_families')
    .select('*, families(*)')
    .eq('trip_id', tripId)

  if (familiesError || !tripFamilies) {
    return NextResponse.json({ error: 'Familien konnten nicht geladen werden' }, { status: 500 })
  }

  // Fetch all expenses with splits
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_splits(*),
      families(*),
      profiles(*)
    `)
    .eq('trip_id', tripId)

  if (expensesError) {
    return NextResponse.json({ error: 'Ausgaben konnten nicht geladen werden' }, { status: 500 })
  }

  const result = computeSettlement(
    (expenses ?? []) as ExpenseWithSplits[],
    tripFamilies as TripFamilyWithFamily[]
  )

  return NextResponse.json(result)
}
