import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createExpenseSchema } from '@/lib/validations/expense'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const parsed = createExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const {
    tripId, paidByParticipantId, coPayers, title, description, amountCents,
    currency, category, expenseDate, splitMode, splits
  } = parsed.data

  // Use the atomic RPC to create expense + splits in one transaction
  const { data: expenseId, error } = await supabase.rpc('create_expense_with_splits', {
    p_trip_id: tripId,
    p_paid_by_participant_id: paidByParticipantId,
    p_title: title,
    p_description: description ?? '',
    p_amount_cents: amountCents,
    p_currency: currency,
    p_category: category,
    p_expense_date: expenseDate,
    p_split_mode: splitMode,
    p_splits: splits.map(s => ({ participant_id: s.participantId, shares: s.shares })),
  })

  if (error) {
    console.error('create_expense_with_splits error:', error)
    return NextResponse.json({ error: 'Ausgabe konnte nicht gespeichert werden' }, { status: 500 })
  }

  // Store co_payers if multiple payers
  if (coPayers && coPayers.length > 0) {
    const admin = createAdminClient()
    const { error: coPayerError } = await admin.from('expenses').update({
      co_payers: coPayers.map(cp => ({ participant_id: cp.participantId, amount_cents: cp.amountCents }))
    }).eq('id', expenseId)
    if (coPayerError) {
      console.error('co_payers update error:', coPayerError)
      // Expense was created but co_payers failed — surface the error
      return NextResponse.json({ error: 'Ausgabe erstellt, aber Mitbezahler konnten nicht gespeichert werden' }, { status: 500 })
    }
  }

  return NextResponse.json({ expenseId }, { status: 201 })
}
