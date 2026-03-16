import type { Database, Enums } from './database'

export type ExpenseCategory = Enums<'expense_category'>
export type TripStatus = Enums<'trip_status'>

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']

// Note: expenses and expense_splits types from database.ts are now updated to match new schema

export type TripParticipant = {
  id: string
  trip_id: string
  name: string
  shares: number
  user_id: string | null
  is_group: boolean
  group_id: string | null
  joined_at: string
}

export type TripParticipantMember = {
  id: string
  participant_id: string
  user_id: string | null
  display_name: string
  is_guest: boolean
  added_at: string
}

export type TripParticipantWithMembers = TripParticipant & {
  members?: TripParticipantMember[]
}

export type Expense = {
  id: string
  trip_id: string
  paid_by_participant_id: string
  title: string
  description: string | null
  amount_cents: number
  currency: string
  category: string
  expense_date: string
  split_mode: string
  created_at: string
  updated_at: string
}

export type ExpenseSplit = {
  id: string
  expense_id: string
  participant_id: string
  shares: number
}

export type ExpenseWithSplits = {
  id: string
  trip_id: string
  paid_by_participant_id: string
  title: string
  description?: string | null
  amount_cents: number
  currency: string
  category: string
  expense_date: string
  split_mode: string
  created_at: string
  updated_at: string
  participant: TripParticipant  // who paid
  expense_splits: Array<{
    id: string
    expense_id: string
    participant_id: string
    shares: number
    participant: TripParticipant
  }>
}

export type SettlementBalance = {
  participantId: string
  participantName: string
  totalPaidCents: number
  totalOwedCents: number
  netBalanceCents: number
}

export type SettlementTransfer = {
  fromParticipantId: string
  fromParticipantName: string
  toParticipantId: string
  toParticipantName: string
  amountCents: number
}

export type Settlement = {
  balances: SettlementBalance[]
  transfers: SettlementTransfer[]
  totalSpentCents: number
}

export type ExpenseSplitInput = {
  participantId: string
  participantName: string
  shares: number
  included: boolean
}

export type ExpenseFormData = {
  title: string
  description?: string
  amountEuros: string
  category: string
  expenseDate: string
  paidByParticipantId: string
  splitMode: 'proportional' | 'custom'
  splits: ExpenseSplitInput[]
}
