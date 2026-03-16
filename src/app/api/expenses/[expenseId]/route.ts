import { createClient } from '@/lib/supabase/server'
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

  const body = await request.json()
  const parsed = updateExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, amountCents, currency, category, expenseDate, splitMode, splits, paidByParticipantId } = parsed.data

  if (!splits || splits.length === 0) {
    return NextResponse.json({ error: 'Splits erforderlich' }, { status: 400 })
  }

  const { error } = await supabase.rpc('update_expense_with_splits', {
    p_expense_id:              expenseId,
    p_title:                   title ?? '',
    p_description:             description ?? '',
    p_amount_cents:            amountCents ?? 0,
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

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ success: true })
}
