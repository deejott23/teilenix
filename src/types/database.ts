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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      expense_splits: {
        Row: {
          expense_id: string
          id: string
          participant_id: string
          shares: number
        }
        Insert: {
          expense_id: string
          id?: string
          participant_id: string
          shares?: number
        }
        Update: {
          expense_id?: string
          id?: string
          participant_id?: string
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
          co_payers: Json | null
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
          co_payers?: Json | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date: string
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
          co_payers?: Json | null
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
      feedback_comments: {
        Row: {
          category: string | null
          comment: string
          created_at: string
          detail_text: string | null
          developer_note: string | null
          feature_label: string | null
          id: string
          page_path: string
          status: string
          tester_email: string
          tester_name: string | null
        }
        Insert: {
          category?: string | null
          comment: string
          created_at?: string
          detail_text?: string | null
          developer_note?: string | null
          feature_label?: string | null
          id?: string
          page_path: string
          status?: string
          tester_email: string
          tester_name?: string | null
        }
        Update: {
          category?: string | null
          comment?: string
          created_at?: string
          detail_text?: string | null
          developer_note?: string | null
          feature_label?: string | null
          id?: string
          page_path?: string
          status?: string
          tester_email?: string
          tester_name?: string | null
        }
        Relationships: []
      }
      feedback_likes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          tester_email: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          tester_email: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          tester_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_likes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          participant_id: string | null
          thread_id: string
          trip_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          participant_id?: string | null
          thread_id: string
          trip_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          participant_id?: string | null
          thread_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "group_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      group_threads: {
        Row: {
          created_at: string
          created_by_participant_id: string | null
          id: string
          linked_emoji: string | null
          linked_id: string | null
          linked_subtitle: string | null
          linked_title: string | null
          linked_type: string | null
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          created_by_participant_id?: string | null
          id?: string
          linked_emoji?: string | null
          linked_id?: string | null
          linked_subtitle?: string | null
          linked_title?: string | null
          linked_type?: string | null
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          created_by_participant_id?: string | null
          id?: string
          linked_emoji?: string | null
          linked_id?: string | null
          linked_subtitle?: string | null
          linked_title?: string | null
          linked_type?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_threads_created_by_participant_id_fkey"
            columns: ["created_by_participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_threads_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          participant_id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          participant_id: string
          trip_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          participant_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      packlist_checks: {
        Row: {
          created_at: string
          id: string
          item_id: string
          participant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          participant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packlist_checks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "packlist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packlist_checks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      packlist_claims: {
        Row: {
          created_at: string
          id: string
          item_id: string
          participant_id: string
          quantity_claimed: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          participant_id: string
          quantity_claimed?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          participant_id?: string
          quantity_claimed?: number
        }
        Relationships: [
          {
            foreignKeyName: "packlist_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "packlist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packlist_claims_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      packlist_items: {
        Row: {
          created_at: string
          created_by_participant_id: string
          group_id: string | null
          id: string
          item_type: string
          quantity_needed: number
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_participant_id: string
          group_id?: string | null
          id?: string
          item_type: string
          quantity_needed?: number
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_participant_id?: string
          group_id?: string | null
          id?: string
          item_type?: string
          quantity_needed?: number
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packlist_items_created_by_participant_id_fkey"
            columns: ["created_by_participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packlist_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packlist_items_trip_id_fkey"
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
      shopping_items: {
        Row: {
          added_by_participant_id: string | null
          bought_at: string | null
          category: string
          created_at: string
          id: string
          is_bought: boolean
          quantity: number
          title: string
          trip_id: string
        }
        Insert: {
          added_by_participant_id?: string | null
          bought_at?: string | null
          category?: string
          created_at?: string
          id?: string
          is_bought?: boolean
          quantity?: number
          title: string
          trip_id: string
        }
        Update: {
          added_by_participant_id?: string | null
          bought_at?: string | null
          category?: string
          created_at?: string
          id?: string
          is_bought?: boolean
          quantity?: number
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_added_by_participant_id_fkey"
            columns: ["added_by_participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          cost_per_person_cents: number | null
          cover_emoji: string | null
          created_at: string
          created_by_participant_id: string
          departure_time: string | null
          description: string | null
          duration_label: string | null
          id: string
          link: string | null
          meeting_point: string | null
          status: string
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          activity_date?: string | null
          activity_type?: string
          cost_per_person_cents?: number | null
          cover_emoji?: string | null
          created_at?: string
          created_by_participant_id: string
          departure_time?: string | null
          description?: string | null
          duration_label?: string | null
          id?: string
          link?: string | null
          meeting_point?: string | null
          status?: string
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          cost_per_person_cents?: number | null
          cover_emoji?: string | null
          created_at?: string
          created_by_participant_id?: string
          departure_time?: string | null
          description?: string | null
          duration_label?: string | null
          id?: string
          link?: string | null
          meeting_point?: string | null
          status?: string
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_activities_created_by_participant_id_fkey"
            columns: ["created_by_participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_activity_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          participant_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          participant_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "trip_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_activity_comments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_activity_votes: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          participant_id: string
          vote: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          participant_id: string
          vote: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          participant_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_activity_votes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "trip_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_activity_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_meal_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          meal_idea_id: string
          participant_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meal_idea_id: string
          participant_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meal_idea_id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_meal_comments_meal_idea_id_fkey"
            columns: ["meal_idea_id"]
            isOneToOne: false
            referencedRelation: "trip_meal_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_meal_comments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_meal_ideas: {
        Row: {
          created_at: string
          created_by_participant_id: string
          description: string | null
          emoji: string
          id: string
          link: string | null
          tags: string[]
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_participant_id: string
          description?: string | null
          emoji?: string
          id?: string
          link?: string | null
          tags?: string[]
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_participant_id?: string
          description?: string | null
          emoji?: string
          id?: string
          link?: string | null
          tags?: string[]
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_meal_ideas_created_by_participant_id_fkey"
            columns: ["created_by_participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_meal_ideas_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_meal_slots: {
        Row: {
          id: string
          meal_idea_id: string | null
          slot_date: string
          slot_type: string
          trip_id: string
        }
        Insert: {
          id?: string
          meal_idea_id?: string | null
          slot_date: string
          slot_type: string
          trip_id: string
        }
        Update: {
          id?: string
          meal_idea_id?: string | null
          slot_date?: string
          slot_type?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_meal_slots_meal_idea_id_fkey"
            columns: ["meal_idea_id"]
            isOneToOne: false
            referencedRelation: "trip_meal_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_meal_slots_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_meal_votes: {
        Row: {
          created_at: string
          id: string
          meal_idea_id: string
          participant_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_idea_id: string
          participant_id: string
          vote?: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_idea_id?: string
          participant_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_meal_votes_meal_idea_id_fkey"
            columns: ["meal_idea_id"]
            isOneToOne: false
            referencedRelation: "trip_meal_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_meal_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participant_members: {
        Row: {
          added_at: string
          display_name: string
          id: string
          is_guest: boolean
          participant_id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string
          display_name: string
          id?: string
          is_guest?: boolean
          participant_id: string
          user_id?: string | null
        }
        Update: {
          added_at?: string
          display_name?: string
          id?: string
          is_guest?: boolean
          participant_id?: string
          user_id?: string | null
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
      trip_participants: {
        Row: {
          group_id: string | null
          id: string
          is_group: boolean
          joined_at: string
          name: string
          shares: number
          trip_id: string
          user_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          is_group?: boolean
          joined_at?: string
          name: string
          shares?: number
          trip_id: string
          user_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          is_group?: boolean
          joined_at?: string
          name?: string
          shares?: number
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
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
          show_packlist: boolean
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
          show_packlist?: boolean
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
          show_packlist?: boolean
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
        Args: { p_email: string; p_full_name: string; p_user_id: string }
        Returns: undefined
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
        Args: { p_end_date?: string; p_name: string; p_start_date?: string }
        Returns: string
      }
      get_trip_by_invite_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
          participant_count: number
          status: string
        }[]
      }
      join_trip_by_code: { Args: { p_code: string }; Returns: Json }
      my_participant_ids: { Args: { trip_uuid: string }; Returns: string[] }
      remove_trip_family: {
        Args: { p_family_id: string; p_trip_id: string }
        Returns: Json
      }
      update_expense_with_splits: {
        Args: {
          p_amount_cents: number
          p_category: string
          p_currency: string
          p_description: string
          p_expense_date: string
          p_expense_id: string
          p_paid_by_participant_id?: string
          p_split_mode: string
          p_splits: Json
          p_title: string
        }
        Returns: undefined
      }
      update_trip_family_shares: {
        Args: {
          p_family_id: string
          p_recalculate?: boolean
          p_shares: number
          p_trip_id: string
        }
        Returns: Json
      }
      user_in_trip: { Args: { p_trip_id: string }; Returns: boolean }
      user_is_trip_participant: {
        Args: { trip_uuid: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
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
