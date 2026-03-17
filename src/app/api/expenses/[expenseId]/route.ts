import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateExpenseSchema } from '@/lib/validations/expense'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const { expenseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Verify the expense exists and the user is a participant in its trip (RLS-gated read)
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, trip_id')
    .eq('id', expenseId)
    .maybeSingle()

  if (!expense) return NextResponse.json({ error: 'Ausgabe nicht gefunden' }, { status: 404 })

  const body = await request.json()
  const parsed = updateExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { title, description, amountCents, currency, category, expenseDate, splitMode, splits, paidByParticipantId, coPayers } = parsed.data

  if (!splits || splits.length === 0) {
    return NextResponse.json({ error: 'Aufteilung ist erforderlich' }, { status: 400 })
  }

  // amountCents is required for an update — reject if missing
  if (amountCents === undefined || amountCents <= 0) {
    return NextResponse.json({ error: 'Ungültiger Betrag' }, { status: 400 })
  }

  const { error } = await supabase.rpc('update_expense_with_splits', {
    p_expense_id:              expenseId,
    p_title:                   title ?? '',
    p_description:             description ?? '',
    p_amount_cents:            amountCents,
    p_currency:                currency ?? 'EUR',
    p_category:                category ?? 'other',
    p_expense_date:            expenseDate ?? new Date().toISOString().split('T')[0],
    p_split_mode:              splitMode ?? 'proportional',
    p_splits:                  splits.map(s => ({ participant_id: s.participantId, shares: s.shares })),
    p_paid_by_participant_id:  paidByParticipantId ?? null,
  })

  if (error) {
    console.error('update_expense_with_splits error:', error)
    return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })
  }

  // Update co_payers (null clears them, array sets them)
  if (coPayers !== undefined) {
    const admin = createAdminClient()
    await admin.from('expenses').update({
      co_payers: coPayers.length > 0
        ? coPayers.map(cp => ({ participant_id: cp.participantId, amount_cents: cp.amountCents }))
        : null
    }).eq('id', expenseId)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const { expenseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Verify the expense exists and the user is a participant in its trip (RLS-gated read)
  // If the user is not in the trip, RLS returns null → 404
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, trip_id')
    .eq('id', expenseId)
    .maybeSingle()

  if (!expense) return NextResponse.json({ error: 'Ausgabe nicht gefunden' }, { status: 404 })

  // Use admin client for the actual delete (RLS blocks deletes in some policies)
  const admin = createAdminClient()
  const { error } = await admin
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ success: true })
}
