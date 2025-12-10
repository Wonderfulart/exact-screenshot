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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          budget_range_high: number | null
          budget_range_low: number | null
          business_type: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          decision_certainty:
            | Database["public"]["Enums"]["decision_certainty"]
            | null
          id: string
          last_contact_date: string | null
          notes: string | null
          updated_at: string
          waffling_score: number | null
        }
        Insert: {
          budget_range_high?: number | null
          budget_range_low?: number | null
          business_type?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          decision_certainty?:
            | Database["public"]["Enums"]["decision_certainty"]
            | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          updated_at?: string
          waffling_score?: number | null
        }
        Update: {
          budget_range_high?: number | null
          budget_range_low?: number | null
          business_type?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          decision_certainty?:
            | Database["public"]["Enums"]["decision_certainty"]
            | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          updated_at?: string
          waffling_score?: number | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          account_id: string
          activity_type: string
          completed_at: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          outcome: string | null
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          activity_type: string
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          outcome?: string | null
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          outcome?: string | null
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string
          ad_size: Database["public"]["Enums"]["ad_size"]
          created_at: string
          id: string
          is_at_risk: boolean
          last_activity_date: string | null
          notes: string | null
          probability: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title_id: string
          updated_at: string
          value: number
        }
        Insert: {
          account_id: string
          ad_size: Database["public"]["Enums"]["ad_size"]
          created_at?: string
          id?: string
          is_at_risk?: boolean
          last_activity_date?: string | null
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          account_id?: string
          ad_size?: Database["public"]["Enums"]["ad_size"]
          created_at?: string
          id?: string
          is_at_risk?: boolean
          last_activity_date?: string | null
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_sent: {
        Row: {
          account_id: string
          body: string
          created_at: string
          deal_id: string | null
          email_type: Database["public"]["Enums"]["email_type"]
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
        }
        Insert: {
          account_id: string
          body: string
          created_at?: string
          deal_id?: string | null
          email_type: Database["public"]["Enums"]["email_type"]
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
        }
        Update: {
          account_id?: string
          body?: string
          created_at?: string
          deal_id?: string | null
          email_type?: Database["public"]["Enums"]["email_type"]
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_sent_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sent_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          name: string
          pages_goal: number
          pages_sold: number
          rate_full_page: number | null
          rate_half_page: number | null
          rate_quarter_page: number | null
          rate_two_page_spread: number | null
          region: string
          revenue_booked: number
          revenue_goal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          pages_goal?: number
          pages_sold?: number
          rate_full_page?: number | null
          rate_half_page?: number | null
          rate_quarter_page?: number | null
          rate_two_page_spread?: number | null
          region: string
          revenue_booked?: number
          revenue_goal?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          pages_goal?: number
          pages_sold?: number
          rate_full_page?: number | null
          rate_half_page?: number | null
          rate_quarter_page?: number | null
          rate_two_page_spread?: number | null
          region?: string
          revenue_booked?: number
          revenue_goal?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ad_size: "quarter_page" | "half_page" | "full_page" | "two_page_spread"
      deal_stage:
        | "prospect"
        | "pitched"
        | "negotiating"
        | "verbal_yes"
        | "contract_sent"
        | "signed"
        | "lost"
      decision_certainty: "firm" | "leaning" | "waffling" | "at_risk"
      email_status: "draft" | "sent" | "opened" | "replied"
      email_type:
        | "initial_pitch"
        | "follow_up"
        | "deadline_reminder"
        | "win_back"
        | "thank_you"
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
      ad_size: ["quarter_page", "half_page", "full_page", "two_page_spread"],
      deal_stage: [
        "prospect",
        "pitched",
        "negotiating",
        "verbal_yes",
        "contract_sent",
        "signed",
        "lost",
      ],
      decision_certainty: ["firm", "leaning", "waffling", "at_risk"],
      email_status: ["draft", "sent", "opened", "replied"],
      email_type: [
        "initial_pitch",
        "follow_up",
        "deadline_reminder",
        "win_back",
        "thank_you",
      ],
    },
  },
} as const
