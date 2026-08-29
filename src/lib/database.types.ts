export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          default_refresh_cycle_years: number;
          default_inflation_rate: number;
          floors_enabled: boolean;
          industry_type: string;
          benchmark_participation: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_refresh_cycle_years?: number;
          default_inflation_rate?: number;
          floors_enabled?: boolean;
          industry_type?: string;
          benchmark_participation?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_refresh_cycle_years?: number;
          default_inflation_rate?: number;
          floors_enabled?: boolean;
          industry_type?: string;
          benchmark_participation?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "read_only";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member" | "read_only";
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member" | "read_only";
          created_at?: string;
        };
        Relationships: [];
      };
      campuses: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      buildings: {
        Row: {
          id: string;
          organization_id: string;
          campus_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          campus_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          campus_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      floors: {
        Row: {
          id: string;
          organization_id: string;
          building_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          building_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          building_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      physical_locations: {
        Row: {
          id: string;
          organization_id: string;
          building_id: string;
          floor_id: string | null;
          name: string;
          location_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          building_id: string;
          floor_id?: string | null;
          name: string;
          location_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          building_id?: string;
          floor_id?: string | null;
          name?: string;
          location_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spaces: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          space_type: string;
          commissioned_date: string;
          refresh_cycle_years: number;
          original_cost: number;
          planning_status: "unplanned" | "scheduled" | "deferred" | "completed";
          planned_refresh_year: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          space_type: string;
          commissioned_date: string;
          refresh_cycle_years: number;
          original_cost?: number;
          planning_status?: "unplanned" | "scheduled" | "deferred" | "completed";
          planned_refresh_year?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          space_type?: string;
          commissioned_date?: string;
          refresh_cycle_years?: number;
          original_cost?: number;
          planning_status?: "unplanned" | "scheduled" | "deferred" | "completed";
          planned_refresh_year?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      space_locations: {
        Row: {
          id: string;
          organization_id: string;
          space_id: string;
          physical_location_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          space_id: string;
          physical_location_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          space_id?: string;
          physical_location_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          organization_id: string;
          space_id: string;
          manufacturer: string;
          model_number: string;
          category: string;
          serial_number: string | null;
          ip_address: string | null;
          mac_address: string | null;
          po_number: string | null;
          install_date: string;
          cost: number;
          status: "active" | "retired";
          refresh_cycle_years: number;
          removed_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          space_id: string;
          manufacturer?: string;
          model_number?: string;
          category?: string;
          serial_number?: string | null;
          ip_address?: string | null;
          mac_address?: string | null;
          po_number?: string | null;
          install_date: string;
          cost?: number;
          status?: "active" | "retired";
          refresh_cycle_years: number;
          removed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          space_id?: string;
          manufacturer?: string;
          model_number?: string;
          category?: string;
          serial_number?: string | null;
          ip_address?: string | null;
          mac_address?: string | null;
          po_number?: string | null;
          install_date?: string;
          cost?: number;
          status?: "active" | "retired";
          refresh_cycle_years?: number;
          removed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      forecast_cost_components: {
        Row: {
          id: string;
          organization_id: string;
          space_id: string;
          asset_id: string | null;
          cost_basis: number;
          cost_basis_date: string;
          refresh_cycle_years: number;
          recommended_replacement_year: number;
          inflation_rate: number;
          forecast_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          space_id: string;
          asset_id?: string | null;
          cost_basis: number;
          cost_basis_date: string;
          refresh_cycle_years: number;
          recommended_replacement_year: number;
          inflation_rate?: number;
          forecast_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          space_id?: string;
          asset_id?: string | null;
          cost_basis?: number;
          cost_basis_date?: string;
          refresh_cycle_years?: number;
          recommended_replacement_year?: number;
          inflation_rate?: number;
          forecast_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      refresh_events: {
        Row: {
          id: string;
          organization_id: string;
          space_id: string;
          type:
            | "initial_deployment"
            | "full_refresh"
            | "partial_refresh"
            | "individual_replacement";
          event_date: string;
          description: string;
          cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          space_id: string;
          type:
            | "initial_deployment"
            | "full_refresh"
            | "partial_refresh"
            | "individual_replacement";
          event_date: string;
          description?: string;
          cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          space_id?: string;
          type?:
            | "initial_deployment"
            | "full_refresh"
            | "partial_refresh"
            | "individual_replacement";
          event_date?: string;
          description?: string;
          cost?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      membership_role: "owner" | "admin" | "member" | "read_only";
      planning_status: "unplanned" | "scheduled" | "deferred" | "completed";
      asset_status: "active" | "retired";
      refresh_event_type:
        | "initial_deployment"
        | "full_refresh"
        | "partial_refresh"
        | "individual_replacement";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Organization = Tables<"organizations">;
export type SpaceRow = Tables<"spaces">;
export type AssetRow = Tables<"assets">;
export type RefreshEventRow = Tables<"refresh_events">;
export type OrganizationMembership = Tables<"organization_memberships">;
