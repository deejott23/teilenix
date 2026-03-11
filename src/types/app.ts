import type { Database, ExpenseCategory } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type TripFamily = Database['public']['Tables']['trip_families']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row']

// Extended types with joined data
export type FamilyWithMembers = Family & {
  family_members: (FamilyMember & { profiles: Profile })[]
}

export type TripFamilyWithFamily = TripFamily & {
  families: Family
}

export type ExpenseWithSplits = Expense & {
  expense_splits: ExpenseSplit[]
  families: Family           // paid_by_family
  profiles: Profile          // paid_by_user
}

export type TripWithFamilies = Trip & {
  trip_families: TripFamilyWithFamily[]
}

// Settlement types
export type FamilyBalance = {
  familyId: string
  familyName: string
  totalPaidCents: number
  totalOwedCents: number
  netBalanceCents: number  // positive = creditor, negative = debtor
}

export type SettlementTransfer = {
  fromFamilyId: string
  fromFamilyName: string
  toFamilyId: string
  toFamilyName: string
  amountCents: number
}

export type SettlementResult = {
  balances: FamilyBalance[]
  transfers: SettlementTransfer[]
  totalSpentCents: number
}

// Expense form types
export type ExpenseSplitInput = {
  familyId: string
  familyName: string
  shares: number
  included: boolean
}

export type ExpenseFormData = {
  title: string
  description?: string
  amountEuros: string  // string for form input, converted to cents on submit
  category: ExpenseCategory
  expenseDate: string
  paidByFamilyId: string
  splitMode: 'proportional' | 'custom'
  splits: ExpenseSplitInput[]
}

// Statistics types
export type CategorySpending = {
  category: ExpenseCategory
  amountCents: number
  count: number
}

export type SpendingOverTime = {
  date: string
  cumulativeCents: number
  dailyCents: number
}

export type FamilySpendingStats = {
  familyId: string
  familyName: string
  totalPaidCents: number
  totalOwedCents: number
  expenseCount: number
  netBalanceCents: number
}
