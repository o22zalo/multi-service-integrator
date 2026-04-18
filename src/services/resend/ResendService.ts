// Path: /src/services/resend/ResendService.ts
// Module: ResendService
// Depends on: ../_base/BaseService, ./ResendApi, ../_registry/ServiceRegistry
// Description: Resend service business logic.

import { BaseService } from '../_base/BaseService'
import { ResendApi } from './ResendApi'
import { ServiceRegistry } from '../_registry/ServiceRegistry'
import type { CreateApiKeyInput, ResendApiKey, ResendConfig, ResendCredential, ResendDomain } from './types'
import type { SubResourceDef } from '@/types/service'

export class ResendService extends BaseService<ResendConfig, ResendCredential, ResendDomain | ResendApiKey> {
  readonly SERVICE_TYPE = 'resend' as const
  readonly SERVICE_LABEL = 'Resend'
  readonly CREDENTIAL_FIELDS = ['api_key']
  readonly ICON = 'mail'
  readonly DESCRIPTION = 'Manage Resend domains and API keys'

  /** Validates a Resend API key. */
  async validateCredentials(creds: ResendCredential): Promise<boolean> {
    try {
      await new ResendApi(creds.api_key).listDomains()
      return true
    } catch {
      return false
    }
  }

  /** Fetches Resend account metadata. */
  async fetchMetadata(creds: ResendCredential): Promise<Partial<ResendConfig>> {
    const me = await new ResendApi(creds.api_key).getMe()
    return {
      account_id: me.id,
      account_name: me.display_name,
      from_email: me.email,
    }
  }

  /** Returns supported Resend sub-resources. */
  getSubResourceTypes(): SubResourceDef[] {
    return [
      { type: 'domains', label: 'Domains', icon: 'globe', canCreate: false, canDelete: true },
      { type: 'api_keys', label: 'API Keys', icon: 'key-round', canCreate: true, canDelete: true },
    ]
  }

  /** Fetches Resend domains or API keys. */
  async fetchSubResources(type: string, accountId: string, uid: string): Promise<(ResendDomain | ResendApiKey)[]> {
    const { credentials } = await this.load(uid, accountId)
    const api = new ResendApi(credentials.api_key)
    if (type === 'domains') return api.listDomains()
    if (type === 'api_keys') return api.listApiKeys()
    return []
  }

  /** Creates a Resend API key. */
  async createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>) {
    if (type !== 'api_keys') {
      return { missing_fields: ['unsupported'], defaults: {} }
    }

    const missing = ['name', 'permission'].filter((field) => !data[field])
    if (missing.length > 0) {
      return { missing_fields: missing, defaults: { permission: 'sending_access' } }
    }

    const { credentials } = await this.load(uid, accountId)
    const api = new ResendApi(credentials.api_key)
    return api.createApiKey({
      name: String(data.name),
      permission: String(data.permission) as CreateApiKeyInput['permission'],
      domain_id: typeof data.domain_id === 'string' ? data.domain_id : undefined,
    })
  }

  /** Deletes a Resend domain or API key. */
  async deleteSubResource(type: string, accountId: string, uid: string, id: string): Promise<void> {
    const { credentials } = await this.load(uid, accountId)
    const api = new ResendApi(credentials.api_key)
    if (type === 'domains') await api.deleteDomain(id)
    if (type === 'api_keys') await api.deleteApiKey(id)
  }
}

ServiceRegistry.register(new ResendService())
