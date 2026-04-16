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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      interview_sessions: {
        Row: {
          answers: Json | null
          company: string | null
          created_at: string
          id: string
          job_title: string
          overall_score: number | null
          questions: Json
          scores: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          company?: string | null
          created_at?: string
          id?: string
          job_title: string
          overall_score?: number | null
          questions?: Json
          scores?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          company?: string | null
          created_at?: string
          id?: string
          job_title?: string
          overall_score?: number | null
          questions?: Json
          scores?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          id: string
          interview_at: string | null
          job_listing_id: string | null
          job_title: string
          match_score: number | null
          notes: string | null
          offer_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string
          id?: string
          interview_at?: string | null
          job_listing_id?: string | null
          job_title: string
          match_score?: number | null
          notes?: string | null
          offer_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          id?: string
          interview_at?: string | null
          job_listing_id?: string | null
          job_title?: string
          match_score?: number | null
          notes?: string | null
          offer_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          company: string
          company_logo: string | null
          company_size: string | null
          created_at: string
          description: string
          education: string | null
          experience_years: number | null
          id: string
          industry: string
          job_title: string
          job_type: string
          location: string
          requirements: string
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills: Json
        }
        Insert: {
          company: string
          company_logo?: string | null
          company_size?: string | null
          created_at?: string
          description: string
          education?: string | null
          experience_years?: number | null
          id?: string
          industry: string
          job_title: string
          job_type?: string
          location: string
          requirements: string
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: Json
        }
        Update: {
          company?: string
          company_logo?: string | null
          company_size?: string | null
          created_at?: string
          description?: string
          education?: string | null
          experience_years?: number | null
          id?: string
          industry?: string
          job_title?: string
          job_type?: string
          location?: string
          requirements?: string
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          company: string | null
          created_at: string
          dimensions: Json | null
          file_path: string | null
          id: string
          job_title: string
          match_score: number
          optimized_content: string | null
          suggestions: Json | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          dimensions?: Json | null
          file_path?: string | null
          id?: string
          job_title: string
          match_score?: number
          optimized_content?: string | null
          suggestions?: Json | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          dimensions?: Json | null
          file_path?: string | null
          id?: string
          job_title?: string
          match_score?: number
          optimized_content?: string | null
          suggestions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          content: string
          created_at: string
          id: string
          match_score: number | null
          original_content: string | null
          rewrite_style: string | null
          target_job_id: string | null
          target_job_title: string | null
          user_id: string
          version_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_score?: number | null
          original_content?: string | null
          rewrite_style?: string | null
          target_job_id?: string | null
          target_job_title?: string | null
          user_id: string
          version_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_score?: number | null
          original_content?: string | null
          rewrite_style?: string | null
          target_job_id?: string | null
          target_job_title?: string | null
          user_id?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_target_job_id_fkey"
            columns: ["target_job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
