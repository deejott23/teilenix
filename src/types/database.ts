// Auto-generated types from Supabase.
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// After setting up your Supabase project, replace this file with the generated output.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TripStatus = 'active' | 'ended'
export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'activities' | 'shopping' | 'health' | 'other'
export type FamilyMemberRole = 'admin' | 'member'
export type SplitMode = 'proportional' | 'custom'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          default_shares: number
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          default_shares?: number
          invite_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          default_shares?: number
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: FamilyMemberRole
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role?: FamilyMemberRole
          joined_at?: string
        }
        Update: {
          role?: FamilyMemberRole
        }
      }
      trips: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          status: TripStatus
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: TripStatus
          invite_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: TripStatus
          updated_at?: string
        }
      }
      trip_families: {
        Row: {
          id: string
          trip_id: string
          family_id: string
          shares: number
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          family_id: string
          shares: number
          joined_at?: string
        }
        Update: {
          shares?: number
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          paid_by_family: string
          paid_by_user: string
          title: string
          description: string | null
          amount_cents: number
          currency: string
          category: ExpenseCategory
          expense_date: string
          split_mode: SplitMode
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          paid_by_family: string
          paid_by_user: string
          title: string
          description?: string | null
          amount_cents: number
          currency?: string
          category?: ExpenseCategory
          expense_date?: string
          split_mode?: SplitMode
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          amount_cents?: number
          currency?: string
          category?: ExpenseCategory
          expense_date?: string
          split_mode?: SplitMode
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          family_id: string
          shares: number
        }
        Insert: {
          id?: string
          expense_id: string
          family_id: string
          shares: number
        }
        Update: {
          shares?: number
        }
      }
    }
    Functions: {
      user_in_trip: {
        Args: { trip_uuid: string }
        Returns: boolean
      }
      create_expense_with_splits: {
        Args: {
          p_trip_id: string
          p_paid_by_family: string
          p_paid_by_user: string
          p_title: string
          p_description: string | null
          p_amount_cents: number
          p_currency: string
          p_category: ExpenseCategory
          p_expense_date: string
          p_split_mode: SplitMode
          p_splits: Json
        }
        Returns: string
      }
      update_expense_with_splits: {
        Args: {
          p_expense_id: string
          p_title: string
          p_description: string | null
          p_amount_cents: number
          p_currency: string
          p_category: ExpenseCategory
          p_expense_date: string
          p_split_mode: SplitMode
          p_splits: Json
        }
        Returns: void
      }
    }
  }
}
