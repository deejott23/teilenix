export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      expense_splits: {
        Row: {
          expense_id: string
          participant_id: string
          id: string
          shares: number
        }
        Insert: {
          expense_id: string
          participant_id: string
          id?: string
          shares: number
        }
        Update: {
          expense_id?: string
          participant_id?: string
          id?: string
          shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          category: string
          co_payers: { participant_id: string; amount_cents: number }[] | null
          created_at: string
          currency: string
          description: string | null
          expense_date: string
          id: string
          paid_by_participant_id: string
          split_mode: string
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          category?: string
          co_payers?: { participant_id: string; amount_cents: number }[] | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          paid_by_participant_id: string
          split_mode?: string
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          co_payers?: { participant_id: string; amount_cents: number }[] | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          paid_by_participant_id?: string
          split_mode?: string
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_paid_by_participant_id_fkey"
            columns: ["paid_by_participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_participants: {
        Row: {
          id: string
          trip_id: string
          name: string
          shares: number
          user_id: string | null
          is_group: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          shares?: number
          user_id?: string | null
          is_group?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          shares?: number
          user_id?: string | null
          is_group?: boolean
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participant_members: {
        Row: {
          id: string
          participant_id: string
          user_id: string | null
          display_name: string
          is_guest: boolean
          added_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          user_id?: string | null
          display_name: string
          is_guest?: boolean
          added_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          user_id?: string | null
          display_name?: string
          is_guest?: boolean
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participant_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cover_emoji: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          custom_categories: string[] | null
          description: string | null
          enabled_categories: string[] | null
          end_date: string | null
          id: string
          invite_code: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          cover_emoji?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          custom_categories?: string[] | null
          description?: string | null
          enabled_categories?: string[] | null
          end_date?: string | null
          id?: string
          invite_code: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          cover_emoji?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          custom_categories?: string[] | null
          description?: string | null
          enabled_categories?: string[] | null
          end_date?: string | null
          id?: string
          invite_code?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_setup_user: {
        Args: {
          p_avatar_url: string
          p_display_name: string
          p_email: string
        }
        Returns: void
      }
      create_expense_with_splits: {
        Args: {
          p_amount_cents: number
          p_category: string
          p_currency: string
          p_description: string
          p_expense_date: string
          p_paid_by_participant_id: string
          p_split_mode: string
          p_splits: Json
          p_title: string
          p_trip_id: string
        }
        Returns: string
      }
      create_trip_with_participant: {
        Args: {
          p_name: string
          p_start_date?: string | null
          p_end_date?: string | null
        }
        Returns: string
      }
      join_trip_by_code: {
        Args: { p_code: string }
        Returns: Json
      }
      get_trip_by_invite_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
          status: string
          participant_count: number
        }[]
      }
      update_expense_with_splits: {
        Args: {
          p_amount_cents: number
          p_category: string
          p_currency: string
          p_description: string
          p_expense_date: string
          p_expense_id: string
          p_split_mode: string
          p_splits: Json
          p_title: string
          p_paid_by_participant_id?: string | null
        }
        Returns: undefined
      }
      user_in_trip: { Args: { p_trip_id: string }; Returns: boolean }
      created_by_user: { Args: { p_trip_id: string }; Returns: boolean }
    }
    Enums: {
      expense_category:
        | "food"
        | "transport"
        | "accommodation"
        | "activities"
        | "shopping"
        | "health"
        | "other"
      trip_status: "active" | "ended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      expense_category: [
        "food",
        "transport",
        "accommodation",
        "activities",
        "shopping",
        "health",
        "other",
      ],
      trip_status: ["active", "ended"],
    },
  },
} as const
