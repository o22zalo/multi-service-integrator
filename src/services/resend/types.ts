// Path: /src/services/resend/types.ts
// Module: Resend Types
// Depends on: none
// Description: Shared types for Resend service flows.

export interface ResendCredential {
  api_key: string
}

export interface ResendConfig {
  from_email: string
  account_id: string
  account_name: string
}

export interface ResendDomain {
  id: string
  name: string
  status: 'verified' | 'pending' | 'failed'
  region: 'us-east-1' | 'eu-west-1' | 'sa-east-1'
  created_at: string
  dns_records: Array<{ record: string; name: string; type: string; ttl: string; status: 'verified' | 'pending'; value: string }>
}

export interface ResendApiKey {
  id: string
  name: string
  created_at: string
  permission: 'full_access' | 'sending_access'
}

export interface CreateApiKeyInput {
  name: string
  permission: 'full_access' | 'sending_access'
  domain_id?: string
}
