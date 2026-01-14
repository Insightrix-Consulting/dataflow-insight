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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_url: string | null
          filename: string
          id: string
          overall_confidence: number | null
          status: Database["public"]["Enums"]["document_status"]
          supplier_name: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_url?: string | null
          filename: string
          id?: string
          overall_confidence?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          supplier_name?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_url?: string | null
          filename?: string
          id?: string
          overall_confidence?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          supplier_name?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      energy_invoices: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          confidence_invoice_date: number | null
          confidence_kwh: number | null
          confidence_reading_type: number | null
          created_at: string
          document_id: string
          id: string
          invoice_date: string | null
          kwh_used: number | null
          reading_type: Database["public"]["Enums"]["reading_type"] | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          updated_at: string
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          confidence_invoice_date?: number | null
          confidence_kwh?: number | null
          confidence_reading_type?: number | null
          created_at?: string
          document_id: string
          id?: string
          invoice_date?: string | null
          kwh_used?: number | null
          reading_type?: Database["public"]["Enums"]["reading_type"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          updated_at?: string
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          confidence_invoice_date?: number | null
          confidence_kwh?: number | null
          confidence_reading_type?: number | null
          created_at?: string
          document_id?: string
          id?: string
          invoice_date?: string | null
          kwh_used?: number | null
          reading_type?: Database["public"]["Enums"]["reading_type"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transport_records: {
        Row: {
          created_at: string
          destination_postcode: string | null
          id: string
          receipt_created_date: string | null
          ship_area: string | null
          ship_country: string | null
          supplier_code: string | null
          supplier_name: string | null
          total_weight: number | null
          transport_mode: Database["public"]["Enums"]["transport_mode"] | null
          uk_zone: Database["public"]["Enums"]["uk_zone"] | null
        }
        Insert: {
          created_at?: string
          destination_postcode?: string | null
          id?: string
          receipt_created_date?: string | null
          ship_area?: string | null
          ship_country?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          total_weight?: number | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
          uk_zone?: Database["public"]["Enums"]["uk_zone"] | null
        }
        Update: {
          created_at?: string
          destination_postcode?: string | null
          id?: string
          receipt_created_date?: string | null
          ship_area?: string | null
          ship_country?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          total_weight?: number | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
          uk_zone?: Database["public"]["Enums"]["uk_zone"] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "reviewer" | "viewer"
      document_status:
        | "uploaded"
        | "processing"
        | "needs_review"
        | "approved"
        | "failed"
      document_type: "energy" | "transport" | "unknown"
      reading_type: "Actual" | "Estimated" | "Customer Read" | "Unknown"
      transport_mode: "Road" | "Air" | "Sea" | "Unknown"
      uk_zone: "Mainland" | "Island" | "Ireland" | "Unknown"
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
      app_role: ["admin", "reviewer", "viewer"],
      document_status: [
        "uploaded",
        "processing",
        "needs_review",
        "approved",
        "failed",
      ],
      document_type: ["energy", "transport", "unknown"],
      reading_type: ["Actual", "Estimated", "Customer Read", "Unknown"],
      transport_mode: ["Road", "Air", "Sea", "Unknown"],
      uk_zone: ["Mainland", "Island", "Ireland", "Unknown"],
    },
  },
} as const
