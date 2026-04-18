// Path: /src/services/google-creds/GoogleCredsService.ts
// Module: GoogleCredsService
// Depends on: ../_base/BaseService, ./GoogleCredsApi, ../_registry/ServiceRegistry
// Description: Google credential storage service.

import { BaseService } from '../_base/BaseService'
import { GoogleCredsApi } from './GoogleCredsApi'
import { ServiceRegistry } from '../_registry/ServiceRegistry'
import type { GCPProject, GoogleCredential, GoogleCredsConfig } from './types'
import type { SubResourceDef } from '@/types/service'

export class GoogleCredsService extends BaseService<GoogleCredsConfig, GoogleCredential, GCPProject> {
  readonly SERVICE_TYPE = 'google-creds' as const
  readonly SERVICE_LABEL = 'Google Credentials'
  readonly CREDENTIAL_FIELDS = ['client_secret', 'json_key', 'key']
  readonly ICON = 'key-round'
  readonly DESCRIPTION = 'Manage Google OAuth apps, service accounts, and API keys'

  /** Validates Google credentials based on the credential subtype. */
  async validateCredentials(creds: GoogleCredential): Promise<boolean> {
    const api = new GoogleCredsApi()
    try {
      switch (creds.credential_type) {
        case 'oauth_app':
          return api.validateOAuthApp(creds.client_id, creds.client_secret)
        case 'service_account': {
          const parsed = JSON.parse(creds.json_key) as { type?: string; project_id?: string; private_key?: string }
          return parsed.type === 'service_account' && Boolean(parsed.project_id && parsed.private_key)
        }
        case 'api_key':
          return api.validateApiKey(creds.key)
        default:
          return false
      }
    } catch {
      return false
    }
  }

  /** Derives metadata from Google credential content. */
  async fetchMetadata(creds: GoogleCredential): Promise<Partial<GoogleCredsConfig>> {
    if (creds.credential_type === 'service_account') {
      const parsed = JSON.parse(creds.json_key) as { project_id?: string; client_email?: string }
      return {
        credential_type: 'service_account',
        display_name: parsed.client_email ?? 'Service Account',
        project_id: parsed.project_id,
        client_email: parsed.client_email,
      }
    }

    if (creds.credential_type === 'oauth_app') {
      return {
        credential_type: 'oauth_app',
        display_name: `OAuth App - ${creds.client_id}`,
      }
    }

    return {
      credential_type: 'api_key',
      display_name: 'Google API Key',
    }
  }

  /** Returns Google credential sub-resource definitions. */
  getSubResourceTypes(): SubResourceDef[] {
    return [
      { type: 'projects', label: 'GCP Projects', icon: 'folder', canCreate: false, canDelete: false },
    ]
  }

  /** Lists GCP projects when a service account is stored. */
  async fetchSubResources(type: string, accountId: string, uid: string): Promise<GCPProject[]> {
    if (type !== 'projects') return []
    const { credentials } = await this.load(uid, accountId)
    if (credentials.credential_type !== 'service_account') return []
    return new GoogleCredsApi().listProjects(credentials.json_key)
  }

  /** Google project creation is not supported. */
  async createSubResource() {
    return { missing_fields: ['unsupported'], defaults: {} }
  }

  /** Google project deletion is not supported. */
  async deleteSubResource(): Promise<void> {
    throw { code: 'GC-API-001', message: 'Deleting GCP projects is not supported' }
  }
}

ServiceRegistry.register(new GoogleCredsService())
