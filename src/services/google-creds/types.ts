// Path: /src/services/google-creds/types.ts
// Module: Google Credentials Types
// Depends on: none
// Description: Shared types for Google credentials service.

export type GoogleCredType = 'oauth_app' | 'service_account' | 'api_key'

export interface GoogleOAuthCredential {
  credential_type: 'oauth_app'
  client_id: string
  client_secret: string
  redirect_uris: string[]
  app_type: 'web' | 'desktop' | 'mobile'
}

export interface GoogleServiceAccountCredential {
  credential_type: 'service_account'
  json_key: string
  project_id: string
  client_email: string
}

export interface GoogleApiKeyCredential {
  credential_type: 'api_key'
  key: string
  restrictions: string[]
}

export type GoogleCredential = GoogleOAuthCredential | GoogleServiceAccountCredential | GoogleApiKeyCredential

export interface GoogleCredsConfig {
  credential_type: GoogleCredType
  display_name: string
  project_id?: string
  client_email?: string
}

export interface GCPProject {
  projectId: string
  name: string
  projectNumber: string
  lifecycleState: 'ACTIVE' | 'DELETE_REQUESTED' | 'DELETE_IN_PROGRESS'
}
