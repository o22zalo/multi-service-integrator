// Path: /src/services/_base/BaseService.ts
// Module: BaseService
// Depends on: @/lib/firebase/ShardManager, @/lib/crypto/FieldEncryptor, @/lib/logger/AuditLogger, nanoid, crypto
// Description: Abstract base class that implements the common persistence workflow for service modules.

import { createHash } from 'crypto'
import { nanoid } from 'nanoid'
import { encryptService, decryptService } from '@/lib/crypto/FieldEncryptor'
import { ShardManager } from '@/lib/firebase/ShardManager'
import { AuditLogger } from '@/lib/logger/AuditLogger'
import type { ExportPayload, RTDBNode, SubResourceDef } from '@/types/service'
import type { ServiceListItem, ServiceSaveInput, ServiceSaveResult } from './BaseSchema'

export abstract class BaseService<
  TConfig extends object,
  TCredential extends object,
  TSubResource extends object,
> {
  abstract readonly SERVICE_TYPE: string
  abstract readonly SERVICE_LABEL: string
  abstract readonly CREDENTIAL_FIELDS: string[]
  abstract readonly ICON: string
  abstract readonly DESCRIPTION: string

  abstract validateCredentials(creds: TCredential): Promise<boolean>
  abstract fetchMetadata(creds: TCredential): Promise<Partial<TConfig>>
  abstract getSubResourceTypes(): SubResourceDef[]
  abstract fetchSubResources(type: string, accountId: string, uid: string, params?: Record<string, string>): Promise<TSubResource[]>
  abstract createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>): Promise<TSubResource | Record<string, unknown>>
  abstract deleteSubResource(type: string, accountId: string, uid: string, id: string, data?: Record<string, unknown>): Promise<void>

  /** Saves a service account with encrypted credentials. */
  async save(uid: string, input: ServiceSaveInput<TConfig, TCredential>): Promise<ServiceSaveResult> {
    const startedAt = Date.now()
    const id = nanoid(16)
    const encryptedCreds = encryptService(this.SERVICE_TYPE, input.credentials)
    const node: RTDBNode = {
      _meta: this.buildMeta({
        name: input.name,
        status: 'active',
      }),
      credentials: encryptedCreds as Record<string, string>,
      config: input.config,
      sub_resources: {},
    }

    const result = await ShardManager.getInstance().write(`/${uid}/services/${this.SERVICE_TYPE}/${id}`, node)
    await AuditLogger.getInstance().log({
      action: 'SERVICE_CREATE',
      actor: uid,
      target: { type: this.SERVICE_TYPE, id },
      payload: { after: input.config },
      result: 'SUCCESS',
      durationMs: Date.now() - startedAt,
    })

    return { id, shardId: result.shardId }
  }

  /** Loads a service account and decrypts its credentials. */
  async load(uid: string, id: string): Promise<{ config: TConfig; credentials: TCredential }> {
    const result = await ShardManager.getInstance().read<RTDBNode>(uid, this.SERVICE_TYPE, id)
    return {
      config: result.data.config as TConfig,
      credentials: decryptService(this.SERVICE_TYPE, result.data.credentials as TCredential),
    }
  }

  /** Loads a raw encrypted RTDB node for advanced workflows. */
  async loadNode(uid: string, id: string): Promise<{ node: RTDBNode; shardId: string; path: string }> {
    const result = await ShardManager.getInstance().read<RTDBNode>(uid, this.SERVICE_TYPE, id)
    return {
      node: result.data,
      shardId: result.shardId,
      path: result.path,
    }
  }

  /** Lists service accounts without exposing credentials. */
  async list(uid: string): Promise<ServiceListItem[]> {
    const ids = await ShardManager.getInstance().list(uid, this.SERVICE_TYPE)
    const items = await Promise.all(
      ids.map(async ({ id, shardId }) => {
        const { data } = await ShardManager.getInstance().read<RTDBNode>(uid, this.SERVICE_TYPE, id)
        return {
          id,
          uid,
          serviceType: this.SERVICE_TYPE,
          name: String(data._meta.name ?? id),
          email: typeof data.config.account_email === 'string' ? data.config.account_email : typeof data.config.email === 'string' ? data.config.email : undefined,
          status: (data._meta.status as ServiceListItem['status']) ?? 'active',
          shardId,
          createdAt: data._meta.created_at,
          updatedAt: data._meta.updated_at,
        }
      }),
    )

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  /** Updates a service account in place while preserving encrypted fields. */
  async update(uid: string, id: string, input: { name?: string; config?: Partial<TConfig>; credentials?: Partial<TCredential> }): Promise<void> {
    const startedAt = Date.now()
    const loaded = await this.load(uid, id)
    const raw = await this.loadNode(uid, id)
    const mergedCredentials = { ...loaded.credentials, ...(input.credentials ?? {}) } as TCredential
    const encrypted = encryptService(this.SERVICE_TYPE, mergedCredentials)
    const mergedConfig = { ...loaded.config, ...(input.config ?? {}) }

    await ShardManager.getInstance().update(raw.shardId, raw.path, {
      config: mergedConfig,
      credentials: encrypted as Record<string, string>,
      _meta: {
        ...raw.node._meta,
        name: input.name ?? String(raw.node._meta.name ?? id),
      },
    })

    await AuditLogger.getInstance().log({
      action: 'SERVICE_UPDATE',
      actor: uid,
      target: { type: this.SERVICE_TYPE, id },
      payload: { before: raw.node.config, after: mergedConfig },
      result: 'SUCCESS',
      durationMs: Date.now() - startedAt,
    })
  }

  /** Persists sub-resources back into the service node. */
  async saveSubResources(uid: string, id: string, type: string, resources: Record<string, unknown>[]): Promise<void> {
    const raw = await this.loadNode(uid, id)
    const keyed = Object.fromEntries(resources.map((item, index) => [String(item.id ?? item.name ?? index), item]))
    await ShardManager.getInstance().update(raw.shardId, raw.path, {
      sub_resources: {
        ...(raw.node.sub_resources ?? {}),
        [type]: keyed,
      },
    })
  }

  /** Deletes a service account and records an audit entry. */
  async delete(uid: string, id: string): Promise<void> {
    const startedAt = Date.now()
    const record = await this.loadNode(uid, id)
    await ShardManager.getInstance().delete(record.shardId, `/${uid}/services/${this.SERVICE_TYPE}/${id}`)
    await ShardManager.getInstance().delete(record.shardId, `/shard_index/${uid}/${this.SERVICE_TYPE}/${id}`)

    await AuditLogger.getInstance().log({
      action: 'SERVICE_DELETE',
      actor: uid,
      target: { type: this.SERVICE_TYPE, id },
      payload: { before: record.node.config },
      result: 'SUCCESS',
      durationMs: Date.now() - startedAt,
    })
  }

  /** Builds an encrypted export payload for one service scope. */
  async export(uid: string, ids?: string[]): Promise<ExportPayload> {
    const all = await this.list(uid)
    const selected = ids?.length ? all.filter((item) => ids.includes(item.id)) : all
    const entries = await Promise.all(
      selected.map(async (item) => {
        const loaded = await this.loadNode(uid, item.id)
        return [item.id, loaded.node] as const
      }),
    )
    const data = Object.fromEntries(entries)
    const checksum = createHash('sha256').update(JSON.stringify(data)).digest('hex')

    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: uid,
      scope: this.SERVICE_TYPE,
      schema_version: '1',
      data,
      checksum,
    }
  }

  /** Imports raw encrypted records into RTDB. */
  async import(uid: string, payload: ExportPayload): Promise<void> {
    for (const [id, node] of Object.entries(payload.data)) {
      await ShardManager.getInstance().write(`/${uid}/services/${this.SERVICE_TYPE}/${id}`, node)
    }
  }

  /** Builds standard metadata for service nodes. */
  protected buildMeta(extra?: Record<string, unknown>): RTDBNode['_meta'] {
    return {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      schema_v: '1',
      ...extra,
    }
  }
}
