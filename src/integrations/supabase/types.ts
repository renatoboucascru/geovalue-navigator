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
      portfolio_holdings: {
        Row: {
          added_at: string
          cost_basis: number | null
          id: string
          locked: boolean | null
          portfolio_id: string
          shares: number | null
          stock_id: string
          target_allocation_pct: number | null
          target_allocation_usd: number | null
          updated_at: string
        }
        Insert: {
          added_at?: string
          cost_basis?: number | null
          id?: string
          locked?: boolean | null
          portfolio_id: string
          shares?: number | null
          stock_id: string
          target_allocation_pct?: number | null
          target_allocation_usd?: number | null
          updated_at?: string
        }
        Update: {
          added_at?: string
          cost_basis?: number | null
          id?: string
          locked?: boolean | null
          portfolio_id?: string
          shares?: number | null
          stock_id?: string
          target_allocation_pct?: number | null
          target_allocation_usd?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_holdings_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          risk_profile: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          risk_profile?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          risk_profile?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          filter_config: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_config: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filter_config?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      stock_sectors: {
        Row: {
          id: string
          sector_id: string
          stock_id: string
        }
        Insert: {
          id?: string
          sector_id: string
          stock_id: string
        }
        Update: {
          id?: string
          sector_id?: string
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_sectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_sectors_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_themes: {
        Row: {
          id: string
          stock_id: string
          theme_id: string
        }
        Insert: {
          id?: string
          stock_id: string
          theme_id: string
        }
        Update: {
          id?: string
          stock_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_themes_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          beta: number | null
          composite_score: number | null
          confidence: string | null
          country: string | null
          created_at: string
          data_freshness: string | null
          debt_equity: number | null
          dividend_yield: number | null
          ev_ebitda: number | null
          evidence_url: string | null
          exchange: string | null
          fcf_margin: number | null
          forward_pe: number | null
          geo_concentration_risk: number | null
          gross_margin: number | null
          id: string
          iran_gulf_category: string | null
          last_updated: string | null
          market_cap: number | null
          name: string
          net_debt_ebitda: number | null
          notes: string | null
          operating_margin: number | null
          pe_ratio: number | null
          price: number | null
          price_change: number | null
          price_change_percent: number | null
          price_fcf: number | null
          price_sales: number | null
          publicly_traded: boolean | null
          revenue_growth: number | null
          roic: number | null
          roles: string[] | null
          scenario_tailwind: number | null
          ticker: string
          valuation_basis: string | null
          valuation_flag: string | null
        }
        Insert: {
          beta?: number | null
          composite_score?: number | null
          confidence?: string | null
          country?: string | null
          created_at?: string
          data_freshness?: string | null
          debt_equity?: number | null
          dividend_yield?: number | null
          ev_ebitda?: number | null
          evidence_url?: string | null
          exchange?: string | null
          fcf_margin?: number | null
          forward_pe?: number | null
          geo_concentration_risk?: number | null
          gross_margin?: number | null
          id?: string
          iran_gulf_category?: string | null
          last_updated?: string | null
          market_cap?: number | null
          name: string
          net_debt_ebitda?: number | null
          notes?: string | null
          operating_margin?: number | null
          pe_ratio?: number | null
          price?: number | null
          price_change?: number | null
          price_change_percent?: number | null
          price_fcf?: number | null
          price_sales?: number | null
          publicly_traded?: boolean | null
          revenue_growth?: number | null
          roic?: number | null
          roles?: string[] | null
          scenario_tailwind?: number | null
          ticker: string
          valuation_basis?: string | null
          valuation_flag?: string | null
        }
        Update: {
          beta?: number | null
          composite_score?: number | null
          confidence?: string | null
          country?: string | null
          created_at?: string
          data_freshness?: string | null
          debt_equity?: number | null
          dividend_yield?: number | null
          ev_ebitda?: number | null
          evidence_url?: string | null
          exchange?: string | null
          fcf_margin?: number | null
          forward_pe?: number | null
          geo_concentration_risk?: number | null
          gross_margin?: number | null
          id?: string
          iran_gulf_category?: string | null
          last_updated?: string | null
          market_cap?: number | null
          name?: string
          net_debt_ebitda?: number | null
          notes?: string | null
          operating_margin?: number | null
          pe_ratio?: number | null
          price?: number | null
          price_change?: number | null
          price_change_percent?: number | null
          price_fcf?: number | null
          price_sales?: number | null
          publicly_traded?: boolean | null
          revenue_growth?: number | null
          roic?: number | null
          roles?: string[] | null
          scenario_tailwind?: number | null
          ticker?: string
          valuation_basis?: string | null
          valuation_flag?: string | null
        }
        Relationships: []
      }
      supplier_mappings: {
        Row: {
          confidence: string | null
          created_at: string
          customer_id: string
          dependency_strength: number | null
          evidence_type: string | null
          evidence_urls: string[] | null
          geo_concentration_risk: number | null
          id: string
          last_verified_date: string | null
          needs_review: boolean | null
          notes: string | null
          publicly_traded: boolean | null
          supplier_id: string
          supplier_role: string
          updated_at: string
          value_chain_layer: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          customer_id: string
          dependency_strength?: number | null
          evidence_type?: string | null
          evidence_urls?: string[] | null
          geo_concentration_risk?: number | null
          id?: string
          last_verified_date?: string | null
          needs_review?: boolean | null
          notes?: string | null
          publicly_traded?: boolean | null
          supplier_id: string
          supplier_role: string
          updated_at?: string
          value_chain_layer?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string
          customer_id?: string
          dependency_strength?: number | null
          evidence_type?: string | null
          evidence_urls?: string[] | null
          geo_concentration_risk?: number | null
          id?: string
          last_verified_date?: string | null
          needs_review?: boolean | null
          notes?: string | null
          publicly_traded?: boolean | null
          supplier_id?: string
          supplier_role?: string
          updated_at?: string
          value_chain_layer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_mappings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_mappings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_scenario: boolean | null
          name: string
          notes: string | null
          risk_caveats: string | null
          tailwind_scores: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_scenario?: boolean | null
          name: string
          notes?: string | null
          risk_caveats?: string | null
          tailwind_scores?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_scenario?: boolean | null
          name?: string
          notes?: string | null
          risk_caveats?: string | null
          tailwind_scores?: Json | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          read: boolean | null
          stock_id: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          stock_id?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          stock_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      valuation_thresholds: {
        Row: {
          created_at: string
          green_max_forward_pe: number | null
          green_max_pe: number | null
          id: string
          sector_id: string | null
          theme_id: string | null
          updated_at: string
          yellow_max_forward_pe: number | null
          yellow_max_pe: number | null
        }
        Insert: {
          created_at?: string
          green_max_forward_pe?: number | null
          green_max_pe?: number | null
          id?: string
          sector_id?: string | null
          theme_id?: string | null
          updated_at?: string
          yellow_max_forward_pe?: number | null
          yellow_max_pe?: number | null
        }
        Update: {
          created_at?: string
          green_max_forward_pe?: number | null
          green_max_pe?: number | null
          id?: string
          sector_id?: string | null
          theme_id?: string | null
          updated_at?: string
          yellow_max_forward_pe?: number | null
          yellow_max_pe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_thresholds_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_thresholds_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist_items: {
        Row: {
          alert_on_beta_exceeds: number | null
          alert_on_green: boolean | null
          alert_on_price_drop_pct: number | null
          created_at: string
          id: string
          notes: string | null
          stock_id: string
          watchlist_id: string
        }
        Insert: {
          alert_on_beta_exceeds?: number | null
          alert_on_green?: boolean | null
          alert_on_price_drop_pct?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          stock_id: string
          watchlist_id: string
        }
        Update: {
          alert_on_beta_exceeds?: number | null
          alert_on_green?: boolean | null
          alert_on_price_drop_pct?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          stock_id?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
