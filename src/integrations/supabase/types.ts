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
      brokerage_connections: {
        Row: {
          connection_type: string
          created_at: string
          error_message: string | null
          id: string
          institution_id: string | null
          institution_name: string
          last_synced_at: string | null
          plaid_access_token: string | null
          plaid_item_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          institution_id?: string | null
          institution_name: string
          last_synced_at?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string
          last_synced_at?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brokerage_holdings: {
        Row: {
          asset_type: string | null
          connection_id: string | null
          cost_basis_per_share: number | null
          created_at: string
          current_price: number | null
          current_value: number | null
          id: string
          is_crypto: boolean | null
          last_updated: string | null
          name: string | null
          quantity: number
          stock_id: string | null
          ticker: string
          unrealized_pl: number | null
          unrealized_pl_percent: number | null
          user_id: string
        }
        Insert: {
          asset_type?: string | null
          connection_id?: string | null
          cost_basis_per_share?: number | null
          created_at?: string
          current_price?: number | null
          current_value?: number | null
          id?: string
          is_crypto?: boolean | null
          last_updated?: string | null
          name?: string | null
          quantity?: number
          stock_id?: string | null
          ticker: string
          unrealized_pl?: number | null
          unrealized_pl_percent?: number | null
          user_id: string
        }
        Update: {
          asset_type?: string | null
          connection_id?: string | null
          cost_basis_per_share?: number | null
          created_at?: string
          current_price?: number | null
          current_value?: number | null
          id?: string
          is_crypto?: boolean | null
          last_updated?: string | null
          name?: string | null
          quantity?: number
          stock_id?: string | null
          ticker?: string
          unrealized_pl?: number | null
          unrealized_pl_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerage_holdings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "brokerage_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerage_holdings_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerage_transactions: {
        Row: {
          connection_id: string | null
          created_at: string
          fees: number | null
          holding_id: string | null
          id: string
          notes: string | null
          price_per_share: number | null
          quantity: number
          settlement_date: string | null
          ticker: string
          total_amount: number | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          fees?: number | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          quantity: number
          settlement_date?: string | null
          ticker: string
          total_amount?: number | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          fees?: number | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          quantity?: number
          settlement_date?: string | null
          ticker?: string
          total_amount?: number | null
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerage_transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "brokerage_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerage_transactions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "brokerage_holdings"
            referencedColumns: ["id"]
          },
        ]
      }
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
      private_bets: {
        Row: {
          company_name: string
          confidence: string | null
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          funding_stage: string | null
          headquarters: string | null
          id: string
          key_investors: string[] | null
          last_funding_amount: number | null
          last_funding_date: string | null
          notes: string | null
          status: string | null
          tech_category: string
          thesis: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          company_name: string
          confidence?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          key_investors?: string[] | null
          last_funding_amount?: number | null
          last_funding_date?: string | null
          notes?: string | null
          status?: string | null
          tech_category: string
          thesis?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          company_name?: string
          confidence?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          key_investors?: string[] | null
          last_funding_amount?: number | null
          last_funding_date?: string | null
          notes?: string | null
          status?: string | null
          tech_category?: string
          thesis?: string | null
          updated_at?: string
          website_url?: string | null
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
      public_proxies: {
        Row: {
          created_at: string
          exposure_category: string | null
          exposure_strength: number | null
          id: string
          notes: string | null
          private_bet_id: string
          relationship_type: string
          stock_id: string
          thesis: string | null
        }
        Insert: {
          created_at?: string
          exposure_category?: string | null
          exposure_strength?: number | null
          id?: string
          notes?: string | null
          private_bet_id: string
          relationship_type: string
          stock_id: string
          thesis?: string | null
        }
        Update: {
          created_at?: string
          exposure_category?: string | null
          exposure_strength?: number | null
          id?: string
          notes?: string | null
          private_bet_id?: string
          relationship_type?: string
          stock_id?: string
          thesis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_proxies_private_bet_id_fkey"
            columns: ["private_bet_id"]
            isOneToOne: false
            referencedRelation: "private_bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_proxies_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
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
      user_signal_preferences: {
        Row: {
          created_at: string
          enable_whale_signal_boost: boolean | null
          id: string
          tracked_filer_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enable_whale_signal_boost?: boolean | null
          id?: string
          tracked_filer_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enable_whale_signal_boost?: boolean | null
          id?: string
          tracked_filer_ids?: string[] | null
          updated_at?: string
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
      whale_filers: {
        Row: {
          aum_billions: number | null
          cik: string | null
          created_at: string
          description: string | null
          filing_manager_name: string | null
          focus_areas: string[] | null
          id: string
          is_active: boolean | null
          last_filing_date: string | null
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          aum_billions?: number | null
          cik?: string | null
          created_at?: string
          description?: string | null
          filing_manager_name?: string | null
          focus_areas?: string[] | null
          id?: string
          is_active?: boolean | null
          last_filing_date?: string | null
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          aum_billions?: number | null
          cik?: string | null
          created_at?: string
          description?: string | null
          filing_manager_name?: string | null
          focus_areas?: string[] | null
          id?: string
          is_active?: boolean | null
          last_filing_date?: string | null
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      whale_holdings: {
        Row: {
          change_type: string | null
          company_name: string | null
          created_at: string
          filer_id: string
          filing_date: string | null
          filing_quarter: string | null
          id: string
          percent_of_portfolio: number | null
          report_date: string | null
          shares: number
          shares_change: number | null
          stock_id: string | null
          ticker: string
          value_change: number | null
          value_usd: number
        }
        Insert: {
          change_type?: string | null
          company_name?: string | null
          created_at?: string
          filer_id: string
          filing_date?: string | null
          filing_quarter?: string | null
          id?: string
          percent_of_portfolio?: number | null
          report_date?: string | null
          shares?: number
          shares_change?: number | null
          stock_id?: string | null
          ticker: string
          value_change?: number | null
          value_usd?: number
        }
        Update: {
          change_type?: string | null
          company_name?: string | null
          created_at?: string
          filer_id?: string
          filing_date?: string | null
          filing_quarter?: string | null
          id?: string
          percent_of_portfolio?: number | null
          report_date?: string | null
          shares?: number
          shares_change?: number | null
          stock_id?: string | null
          ticker?: string
          value_change?: number | null
          value_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "whale_holdings_filer_id_fkey"
            columns: ["filer_id"]
            isOneToOne: false
            referencedRelation: "whale_filers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whale_holdings_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
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
