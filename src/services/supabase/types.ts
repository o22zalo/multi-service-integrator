// Path: /src/services/supabase/types.ts
// Module: Supabase Types
// Depends on: none
// Description: Shared types for Supabase service flows.

export interface SupabaseCredential {
  service_role_key: string
  anon_key: string
  access_token?: string
}

export interface SupabaseConfig {
  project_url: string
  project_id: string
  project_name: string
  region: string
  db_host: string
}

export interface SupabaseProject {
  id: string
  name: string
  region: string
  created_at: string
  status: 'ACTIVE_HEALTHY' | 'INACTIVE' | 'COMING_UP' | 'UNKNOWN'
}

export interface SupabaseTable {
  name: string
  schema: string
  columns: Array<{ name: string; type: string; nullable: boolean; default?: string }>
}

export interface SupabaseEdgeFunction {
  id: string
  slug: string
  name: string
  status: 'ACTIVE' | 'REMOVED' | 'THROTTLED'
  created_at: string
  version: number
}
