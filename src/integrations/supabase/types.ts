export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievement_types: {
        Row: {
          category: string | null
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          rarity: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          rarity?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      case_codes: {
        Row: {
          case_id: string
          category: string | null
          cpt_code: string
          created_at: string
          description: string
          id: string
          is_primary: boolean | null
          modifiers: string[] | null
          position: number | null
          rvu: number
          user_id: string
        }
        Insert: {
          case_id: string
          category?: string | null
          cpt_code: string
          created_at?: string
          description: string
          id?: string
          is_primary?: boolean | null
          modifiers?: string[] | null
          position?: number | null
          rvu: number
          user_id: string
        }
        Update: {
          case_id?: string
          category?: string | null
          cpt_code?: string
          created_at?: string
          description?: string
          id?: string
          is_primary?: boolean | null
          modifiers?: string[] | null
          position?: number | null
          rvu?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_codes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_requirement_feedback: {
        Row: {
          created_at: string
          description: string | null
          feedback_type: string
          id: string
          original_value: Json | null
          requirement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggested_value: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feedback_type: string
          id?: string
          original_value?: Json | null
          requirement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_value?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feedback_type?: string
          id?: string
          original_value?: Json | null
          requirement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_value?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_requirement_feedback_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "case_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      case_requirements: {
        Row: {
          ai_generated: boolean | null
          category: string
          confidence_level: number | null
          cpt_codes: string[] | null
          created_at: string
          description: string | null
          id: string
          last_reviewed_at: string | null
          max_allowed: number | null
          min_required: number
          needs_review: boolean | null
          source: string | null
          specialty_id: string
          subcategory: string | null
          updated_at: string
          user_feedback_count: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          category: string
          confidence_level?: number | null
          cpt_codes?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          last_reviewed_at?: string | null
          max_allowed?: number | null
          min_required?: number
          needs_review?: boolean | null
          source?: string | null
          specialty_id: string
          subcategory?: string | null
          updated_at?: string
          user_feedback_count?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          category?: string
          confidence_level?: number | null
          cpt_codes?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          last_reviewed_at?: string | null
          max_allowed?: number | null
          min_required?: number
          needs_review?: boolean | null
          source?: string | null
          specialty_id?: string
          subcategory?: string | null
          updated_at?: string
          user_feedback_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "case_requirements_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "surgical_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_name: string
          created_at: string
          estimated_value: number | null
          id: string
          notes: string | null
          patient_mrn: string | null
          procedure_date: string | null
          procedure_description: string | null
          status: string | null
          total_rvu: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          case_name: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          notes?: string | null
          patient_mrn?: string | null
          procedure_date?: string | null
          procedure_description?: string | null
          status?: string | null
          total_rvu?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          case_name?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          notes?: string | null
          patient_mrn?: string | null
          procedure_date?: string | null
          procedure_description?: string | null
          status?: string | null
          total_rvu?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_discoveries: {
        Row: {
          created_at: string
          discovered_user_id: string
          discovery_method: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discovered_user_id: string
          discovery_method?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discovered_user_id?: string
          discovery_method?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      friend_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "friend_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_code: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_code?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_code?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          rank_position: number | null
          specialty_breakdown: Json | null
          total_cases: number | null
          total_rvu: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          rank_position?: number | null
          specialty_breakdown?: Json | null
          total_cases?: number | null
          total_rvu?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          rank_position?: number | null
          specialty_breakdown?: Json | null
          total_cases?: number | null
          total_rvu?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          attachment_id: string
          attachment_type: string
          created_at: string
          id: string
          message_id: string
        }
        Insert: {
          attachment_id: string
          attachment_type: string
          created_at?: string
          id?: string
          message_id: string
        }
        Update: {
          attachment_id?: string
          attachment_type?: string
          created_at?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          preferences_set: boolean | null
          role_selected: boolean | null
          specialty_selected: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          preferences_set?: boolean | null
          role_selected?: boolean | null
          specialty_selected?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          preferences_set?: boolean | null
          role_selected?: boolean | null
          specialty_selected?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          board_certification: string[] | null
          completed_onboarding: boolean | null
          created_at: string
          default_rvu_rate: number | null
          display_name: string | null
          email: string | null
          id: string
          institution: string | null
          license_number: string | null
          onboarding_completed: boolean | null
          practice_name: string | null
          show_tutorial_on_startup: boolean | null
          specialty_id: string | null
          specialty_theme: Json | null
          subspecialty: string | null
          updated_at: string
          user_id: string
          user_role: string | null
          year_of_training: number | null
        }
        Insert: {
          board_certification?: string[] | null
          completed_onboarding?: boolean | null
          created_at?: string
          default_rvu_rate?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          license_number?: string | null
          onboarding_completed?: boolean | null
          practice_name?: string | null
          show_tutorial_on_startup?: boolean | null
          specialty_id?: string | null
          specialty_theme?: Json | null
          subspecialty?: string | null
          updated_at?: string
          user_id: string
          user_role?: string | null
          year_of_training?: number | null
        }
        Update: {
          board_certification?: string[] | null
          completed_onboarding?: boolean | null
          created_at?: string
          default_rvu_rate?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          license_number?: string | null
          onboarding_completed?: boolean | null
          practice_name?: string | null
          show_tutorial_on_startup?: boolean | null
          specialty_id?: string | null
          specialty_theme?: Json | null
          subspecialty?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
          year_of_training?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "surgical_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          referral_id: string
          reward_type: string | null
          reward_value: number | null
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_id: string
          reward_type?: string | null
          reward_value?: number | null
          user_id: string
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_id?: string
          reward_type?: string | null
          reward_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          conversion_date: string | null
          created_at: string
          expires_at: string | null
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_email: string
          referrer_user_id: string
          reward_granted: boolean | null
          status: string | null
          updated_at: string
        }
        Insert: {
          conversion_date?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_email: string
          referrer_user_id: string
          reward_granted?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          conversion_date?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_email?: string
          referrer_user_id?: string
          reward_granted?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resident_cases: {
        Row: {
          case_date: string
          case_id: string | null
          case_name: string
          created_at: string
          id: string
          notes: string | null
          primary_cpt_code: string | null
          requirement_id: string | null
          role: string | null
          specialty_id: string
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          case_date: string
          case_id?: string | null
          case_name: string
          created_at?: string
          id?: string
          notes?: string | null
          primary_cpt_code?: string | null
          requirement_id?: string | null
          role?: string | null
          specialty_id: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          case_date?: string
          case_id?: string | null
          case_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          primary_cpt_code?: string | null
          requirement_id?: string | null
          role?: string | null
          specialty_id?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_cases_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "case_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_cases_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "surgical_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          free_months_remaining: number | null
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          free_months_remaining?: number | null
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          free_months_remaining?: number | null
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_reminders: {
        Row: {
          created_at: string
          dismissed: boolean | null
          dismissed_until: string | null
          id: string
          last_shown: string | null
          reminder_type: string
          shown_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed?: boolean | null
          dismissed_until?: string | null
          id?: string
          last_shown?: string | null
          reminder_type: string
          shown_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed?: boolean | null
          dismissed_until?: string | null
          id?: string
          last_shown?: string | null
          reminder_type?: string
          shown_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      surgical_specialties: {
        Row: {
          abbreviation: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type_id: string
          ai_generated: boolean | null
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
          week_earned: string | null
        }
        Insert: {
          achievement_type_id: string
          ai_generated?: boolean | null
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
          week_earned?: string | null
        }
        Update: {
          achievement_type_id?: string
          ai_generated?: boolean | null
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
          week_earned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_type_id_fkey"
            columns: ["achievement_type_id"]
            isOneToOne: false
            referencedRelation: "achievement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_assessments: {
        Row: {
          ai_insights: string | null
          assessment_data: Json
          created_at: string
          funny_awards: Json | null
          id: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          ai_insights?: string | null
          assessment_data: Json
          created_at?: string
          funny_awards?: Json | null
          id?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          ai_insights?: string | null
          assessment_data?: Json
          created_at?: string
          funny_awards?: Json | null
          id?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reset_password: {
        Args: { user_email: string; new_password: string }
        Returns: boolean
      }
      create_referral_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      reset_user_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "physician" | "admin" | "billing_specialist"
      medical_specialty:
        | "orthopedics"
        | "general_surgery"
        | "plastic_surgery"
        | "ent"
        | "cardiothoracic"
        | "neurosurgery"
        | "urology"
        | "gynecology"
        | "ophthalmology"
        | "dermatology"
        | "gastroenterology"
        | "emergency_medicine"
        | "family_medicine"
        | "internal_medicine"
        | "radiology"
        | "anesthesiology"
        | "pathology"
        | "psychiatry"
        | "pediatrics"
        | "oncology"
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
      app_role: ["physician", "admin", "billing_specialist"],
      medical_specialty: [
        "orthopedics",
        "general_surgery",
        "plastic_surgery",
        "ent",
        "cardiothoracic",
        "neurosurgery",
        "urology",
        "gynecology",
        "ophthalmology",
        "dermatology",
        "gastroenterology",
        "emergency_medicine",
        "family_medicine",
        "internal_medicine",
        "radiology",
        "anesthesiology",
        "pathology",
        "psychiatry",
        "pediatrics",
        "oncology",
      ],
    },
  },
} as const
