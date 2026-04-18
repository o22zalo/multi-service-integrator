// Path: /src/lib/firebase/ShardManager.ts
// Module: Firebase ShardManager
// Depends on: ./FirebaseAdmin, ./ShardSelector, ./index
// Description: Singleton quản lý nhiều Firebase RTDB project.

import { initializeAdminApp, getAdminDb } from './FirebaseAdmin'
import { ShardSelector } from './ShardSelector'
import type { HealthStatus, ReadResult, RTDBNode, ShardConfig, WriteResult } from './index'

const selector = new ShardSelector()

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function extractServicePath(path: string): { uid: string; service: string; recordId: string } | null {
  const parts = normalizePath(path).split('/').filter(Boolean)
  if (parts.length >= 4 && parts[1] === 'services') {
    return {
      uid: parts[0],
      service: parts[2],
      recordId: parts[3],
    }
  }
  return null
}

function flattenForRtdb(input: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.entries(input).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const nextKey = prefix ? `${prefix}/${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenForRtdb(value as Record<string, unknown>, nextKey))
    } else {
      acc[nextKey] = value
    }
    return acc
  }, {})
}

export class ShardManager {
  private static instance: ShardManager | null = null
  private shards: Map<string, ShardConfig> = new Map()
  private healthCache: Map<string, HealthStatus> = new Map()

  private constructor() {
    const loaded = this.loadShardsFromEnv()
    loaded.forEach((shard) => {
      initializeAdminApp(shard)
      this.shards.set(shard.id, shard)
    })

    if (this.shards.size === 0) {
      throw new Error('DB-SHARD-001: No Firebase shards configured')
    }
  }

  /** Returns the singleton shard manager instance. */
  static getInstance(): ShardManager {
    if (!ShardManager.instance) {
      ShardManager.instance = new ShardManager()
    }
    return ShardManager.instance
  }

  /** Selects an available shard for a write operation. */
  getWriteShard(): ShardConfig {
    const available = Array.from(this.shards.values()).filter((shard) => shard.isAvailable)
    if (available.length === 0) {
      throw new Error('DB-SHARD-003: No available shard')
    }
    return selector.selectShard(available)
  }

  /** Returns a known shard config by shard id. */
  getReadShard(shardId: string): ShardConfig {
    const shard = this.shards.get(shardId)
    if (!shard) {
      throw new Error(`DB-SHARD-002: Shard ${shardId} not found`)
    }
    return shard
  }

  /** Writes a node into the selected shard and updates the shard index when applicable. */
  async write(path: string, data: unknown): Promise<WriteResult> {
    const shard = this.getWriteShard()
    const normalizedPath = normalizePath(path)
    const ref = getAdminDb(shard.id).ref(normalizedPath)
    await ref.set(data)

    const extracted = extractServicePath(normalizedPath)
    if (extracted) {
      await this.writeShardIndex(extracted.uid, extracted.service, extracted.recordId, shard.id)
    }

    return {
      shardId: shard.id,
      path: normalizedPath,
      key: extracted?.recordId ?? ref.key ?? '',
    }
  }

  /** Reads a record by looking up the shard index first. */
  async read<T>(uid: string, service: string, recordId: string): Promise<ReadResult<T>> {
    const shardId = await this.readShardIndex(uid, service, recordId)
    if (!shardId) {
      throw new Error('DB-READ-001: Record not found in shard index')
    }

    const path = `/${uid}/services/${service}/${recordId}`
    const snapshot = await getAdminDb(shardId).ref(path).get()
    if (!snapshot.exists()) {
      throw new Error('DB-READ-001: Record not found')
    }

    return {
      data: snapshot.val() as T,
      shardId,
      path,
    }
  }

  /** Lists lightweight record ids for a user and service type. */
  async list(uid: string, service: string): Promise<Array<{ id: string; shardId: string }>> {
    const indexDb = getAdminDb(this.getWriteShard().id)
    const snapshot = await indexDb.ref(`/shard_index/${uid}/${service}`).get()
    const value = (snapshot.val() ?? {}) as Record<string, { shardId: string }>

    return Object.entries(value).map(([id, item]) => ({
      id,
      shardId: item.shardId,
    }))
  }

  /** Deletes a node from a known shard path. */
  async delete(shardId: string, path: string): Promise<void> {
    await getAdminDb(shardId).ref(normalizePath(path)).remove()
  }

  /** Partially updates a node and always refreshes _meta.updated_at. */
  async update(shardId: string, path: string, data: Partial<RTDBNode>): Promise<void> {
    const flattened = flattenForRtdb(data as Record<string, unknown>)
    flattened['_meta/updated_at'] = new Date().toISOString()
    await getAdminDb(shardId).ref(normalizePath(path)).update(flattened)
  }

  /** Writes the central shard index for a record. */
  private async writeShardIndex(uid: string, service: string, recordId: string, shardId: string): Promise<void> {
    await getAdminDb(this.getWriteShard().id)
      .ref(`/shard_index/${uid}/${service}/${recordId}`)
      .set({
        shardId,
        createdAt: new Date().toISOString(),
      })
  }

  /** Reads the shard index entry for a record. */
  private async readShardIndex(uid: string, service: string, recordId: string): Promise<string | null> {
    const snapshot = await getAdminDb(this.getWriteShard().id)
      .ref(`/shard_index/${uid}/${service}/${recordId}`)
      .get()

    return snapshot.exists() ? snapshot.val().shardId ?? null : null
  }

  /** Performs health checks for all shards and updates availability state. */
  async checkHealth(): Promise<HealthStatus[]> {
    const results = await Promise.all(
      Array.from(this.shards.keys()).map((shardId) => this.pingWithTimeout(shardId)),
    )

    results.forEach((status) => {
      const shard = this.shards.get(status.shardId)
      if (shard) shard.isAvailable = status.isHealthy
      this.healthCache.set(status.shardId, status)
    })

    return results
  }

  /** Pings a shard and resolves within the given timeout. */
  private async pingWithTimeout(shardId: string, timeoutMs = 5000): Promise<HealthStatus> {
    const startedAt = Date.now()

    const dbPromise = getAdminDb(shardId).ref('/.info/connected').get()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    })

    try {
      await Promise.race([dbPromise, timeoutPromise])
      return {
        shardId,
        isHealthy: true,
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        shardId,
        isHealthy: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /** Loads shard configuration from numbered environment variables. */
  private loadShardsFromEnv(): ShardConfig[] {
    const count = Number(process.env.FIREBASE_SHARD_COUNT ?? 0)
    const maxIndex = Number.isFinite(count) && count > 0 ? count : 10
    const shards: ShardConfig[] = []

    for (let i = 1; i <= maxIndex; i += 1) {
      const projectId = process.env[`FIREBASE_SHARD_${i}_PROJECT_ID`]
      const databaseUrl = process.env[`FIREBASE_SHARD_${i}_DATABASE_URL`]
      const serviceAccountBase64 = process.env[`FIREBASE_SHARD_${i}_SERVICE_ACCOUNT`]

      if (!projectId || !databaseUrl || !serviceAccountBase64) {
        continue
      }

      shards.push({
        id: `shard_${i}`,
        projectId,
        databaseUrl,
        serviceAccountBase64,
        capacity: 100_000,
        currentLoad: 0,
        isAvailable: true,
      })
    }

    return shards
  }
}
