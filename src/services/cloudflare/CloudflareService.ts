// Path: /src/services/cloudflare/CloudflareService.ts
// Module: CloudflareService
// Depends on: ../_base/BaseService, ./CloudflareApi, ../_registry/ServiceRegistry
// Description: Cloudflare service business logic.

import { BaseService } from '../_base/BaseService'
import { CloudflareApi } from './CloudflareApi'
import { ServiceRegistry } from '../_registry/ServiceRegistry'
import type { CloudflareConfig, CloudflareCredential, CFDnsRecord, CFTunnel, CFZone } from './types'
import type { SubResourceDef } from '@/types/service'

export class CloudflareService extends BaseService<CloudflareConfig, CloudflareCredential, CFZone | CFTunnel | CFDnsRecord> {
  readonly SERVICE_TYPE = 'cloudflare' as const
  readonly SERVICE_LABEL = 'Cloudflare'
  readonly CREDENTIAL_FIELDS = ['api_key', 'api_token']
  readonly ICON = 'cloud'
  readonly DESCRIPTION = 'Manage Cloudflare zones, tunnels, and DNS records'

  /** Validates Cloudflare credentials by reading an account. */
  async validateCredentials(creds: CloudflareCredential): Promise<boolean> {
    try {
      await new CloudflareApi(creds).getAccount()
      return true
    } catch {
      return false
    }
  }

  /** Fetches Cloudflare account metadata. */
  async fetchMetadata(creds: CloudflareCredential): Promise<Partial<CloudflareConfig>> {
    const account = await new CloudflareApi(creds).getAccount()
    return {
      account_id: account.id,
      account_name: account.name,
      plan: creds.api_token ? 'token' : 'global-key',
    }
  }

  /** Returns Cloudflare sub-resource definitions. */
  getSubResourceTypes(): SubResourceDef[] {
    return [
      { type: 'zones', label: 'Zones', icon: 'globe', canCreate: false, canDelete: false },
      { type: 'tunnels', label: 'Tunnels', icon: 'cloud', canCreate: true, canDelete: true },
      { type: 'dns_records', label: 'DNS Records', icon: 'webhook', canCreate: true, canDelete: true, requiresInput: ['zone_id'] },
    ]
  }

  /** Fetches Cloudflare sub-resources. */
  async fetchSubResources(type: string, accountId: string, uid: string, params: Record<string, string> = {}): Promise<(CFZone | CFTunnel | CFDnsRecord)[]> {
    const { config, credentials } = await this.load(uid, accountId)
    const api = new CloudflareApi(credentials)

    switch (type) {
      case 'zones': {
        const firstPage = await api.listZones(1)
        return firstPage.result
      }
      case 'tunnels': {
        return api.listTunnels(String(config.account_id))
      }
      case 'dns_records': {
        if (!params.zone_id) return []
        return api.listDnsRecords(params.zone_id)
      }
      default:
        return []
    }
  }

  /** Creates a Cloudflare tunnel or DNS record. */
  async createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>) {
    const { config, credentials } = await this.load(uid, accountId)
    const api = new CloudflareApi(credentials)

    if (type === 'tunnels') {
      if (!data.name) return { missing_fields: ['name'], defaults: {} }
      return api.createTunnel(String(config.account_id), String(data.name))
    }

    if (type === 'dns_records') {
      const missing = ['zone_id', 'type', 'name', 'content'].filter((field) => !data[field])
      if (missing.length > 0) return { missing_fields: missing, defaults: { ttl: 1, proxied: true } }
      return api.createDnsRecord(String(data.zone_id), {
        zone_id: String(data.zone_id),
        type: String(data.type) as CFDnsRecord['type'],
        name: String(data.name),
        content: String(data.content),
        ttl: data.ttl ? Number(data.ttl) : 1,
        proxied: data.proxied !== 'false',
      })
    }

    return { missing_fields: ['type'], defaults: {} }
  }

  /** Deletes a Cloudflare tunnel or DNS record. */
  async deleteSubResource(type: string, accountId: string, uid: string, id: string, data: Record<string, unknown> = {}): Promise<void> {
    const { config, credentials } = await this.load(uid, accountId)
    const api = new CloudflareApi(credentials)

    if (type === 'tunnels') {
      await api.deleteTunnel(String(config.account_id), id)
    }

    if (type === 'dns_records' && data.zone_id) {
      await api.deleteDnsRecord(String(data.zone_id), id)
    }
  }
}

ServiceRegistry.register(new CloudflareService())
