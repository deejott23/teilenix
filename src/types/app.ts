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

export type CoPayerEntry = {
  participant_id: string
  amount_cents: number
}

export type ExpenseWithSplits = {
  id: string
  trip_id: string
  paid_by_participant_id: string
  co_payers?: CoPayerEntry[] | null
  title: string
  description?: string | null
  amount_cents: number
  currency: string
  category: string
  expense_date: string
  split_mode: string
  created_at: string
  updated_at: string
  participant: TripParticipant  // primary payer
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
  overrideAmountCents?: number   // wenn gesetzt: fixer Betrag statt shares-basiert
}

// ── Packlist ──
export type PacklistItemType = 'bringing' | 'group_need'

export type PacklistClaim = {
  id: string
  item_id: string
  participant_id: string
  quantity_claimed: number
  participant_name: string
}

export type PacklistItem = {
  id: string
  trip_id: string
  created_by_participant_id: string
  item_type: PacklistItemType
  title: string
  quantity_needed: number
  group_id: string | null
  created_at: string
  // resolved client-side
  checked: boolean
  claims: PacklistClaim[]
  creator_name: string
}

export type ExpenseFormData = {
  title: string
  description?: string
  amountEuros: string
  category: string
  expenseDate: string
  paidByParticipantId: string
  coPayers?: CoPayerEntry[]
  splitMode: 'proportional' | 'custom'
  splits: ExpenseSplitInput[]
}

// ── Activities (Ausflüge) ──
export type ActivityType = 'activity' | 'boat' | 'food' | 'culture' | 'swimming' | 'shopping' | 'other'
export type ActivityStatus = 'idea' | 'confirmed' | 'cancelled'
export type VoteValue = 'yes' | 'maybe' | 'no'

export type Activity = {
  id: string
  trip_id: string
  created_by_participant_id: string
  title: string
  activity_type: ActivityType
  description: string | null
  link: string | null
  activity_date: string | null
  departure_time: string | null
  duration_label: string | null
  meeting_point: string | null
  cost_per_person_cents: number | null
  status: ActivityStatus
  cover_emoji: string | null
  created_at: string
  updated_at: string
}

export type ActivityComment = {
  id: string
  activity_id: string
  participant_id: string
  content: string
  created_at: string
  participant_name: string
}

export type ActivityVote = {
  id: string
  activity_id: string
  participant_id: string
  vote: VoteValue
  created_at: string
}

export type ActivityWithVotes = Activity & {
  votes: ActivityVote[]
  creator_name: string
  comment_count?: number
}

// ── Meals (Essen) ──
export type MealVoteValue = 'yes' | 'maybe' | 'no'

export type MealVote = {
  id: string
  meal_idea_id: string
  participant_id: string
  vote: MealVoteValue
  created_at: string
}

export type MealComment = {
  id: string
  meal_idea_id: string
  participant_id: string
  content: string
  created_at: string
  participant_name: string
}

export type MealIdea = {
  id: string
  trip_id: string
  created_by_participant_id: string
  title: string
  emoji: string
  description: string | null
  tags: string[]
  link: string | null
  created_at: string
  updated_at: string
  // resolved client-side
  creator_name: string
  vote_count: number          // count of 'yes' (lecker) votes
  maybe_count: number         // count of 'maybe' votes
  no_count: number            // count of 'no' votes
  my_vote_value: MealVoteValue | null  // current user's vote (replaces my_vote: boolean)
}

export type MealSlot = {
  id: string
  trip_id: string
  meal_idea_id: string | null
  slot_date: string
  slot_type: 'lunch' | 'dinner'
  meal?: MealIdea
}
