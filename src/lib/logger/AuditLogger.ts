// Path: /src/lib/logger/AuditLogger.ts
// Module: AuditLogger
// Depends on: nanoid, ../firebase/ShardManager, ./index
// Description: Buffered audit logging to Firebase RTDB.

import { nanoid } from 'nanoid'
import { ShardManager } from '../firebase/ShardManager'
import type { AuditEntry, AuditLogFilters } from './index'

export class AuditLogger {
  private static instance: AuditLogger | null = null
  private buffer: AuditEntry[] = []
  private fallbackQueue: AuditEntry[] = []
  private readonly FLUSH_SIZE = 10
  private readonly RTDB_PATH = '/audit_logs'
  private flushTimer: NodeJS.Timeout | null = null

  private constructor() {}

  /** Returns the singleton audit logger instance. */
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /** Queues an audit entry and flushes in batches. */
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    }

    this.buffer.push(fullEntry)

    if (this.buffer.length >= this.FLUSH_SIZE) {
      await this.flush()
      return
    }

    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => {
      void this.flush()
    }, 2000)
  }

  /** Fetches audit logs for a user and applies in-memory filters. */
  async getLogs(uid: string, filters: AuditLogFilters = {}): Promise<AuditEntry[]> {
    const shardId = ShardManager.getInstance().getWriteShard().id
    const snapshot = await ShardManager.getInstance()
      .getReadShard(shardId)
    void snapshot

    const raw = await (await import('../firebase/FirebaseAdmin')).getAdminDb(shardId)
      .ref(`${this.RTDB_PATH}/${uid}`)
      .orderByChild('timestamp')
      .get()

    let logs = Object.values((raw.val() ?? {}) as Record<string, AuditEntry>)

    if (filters.from) {
      const fromTs = new Date(filters.from).getTime()
      logs = logs.filter((log) => new Date(log.timestamp).getTime() >= fromTs)
    }

    if (filters.to) {
      const toTs = new Date(filters.to).getTime()
      logs = logs.filter((log) => new Date(log.timestamp).getTime() <= toTs)
    }

    if (filters.action) logs = logs.filter((log) => log.action === filters.action)
    if (filters.result) logs = logs.filter((log) => log.result === filters.result)
    if (filters.serviceType) logs = logs.filter((log) => log.target.type === filters.serviceType)

    const limit = Math.min(filters.limit ?? 50, 500)
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
  }

  /** Flushes the buffered audit entries to RTDB. */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0 && this.fallbackQueue.length === 0) {
      if (this.flushTimer) clearTimeout(this.flushTimer)
      this.flushTimer = null
      return
    }

    const entries = [...this.fallbackQueue, ...this.buffer]
    this.buffer = []
    this.fallbackQueue = []

    const grouped = entries.reduce<Record<string, AuditEntry[]>>((acc, entry) => {
      const bucket = acc[entry.actor] ?? []
      bucket.push(entry)
      acc[entry.actor] = bucket
      return acc
    }, {})

    try {
      const shardId = ShardManager.getInstance().getWriteShard().id
      const { getAdminDb } = await import('../firebase/FirebaseAdmin')
      const db = getAdminDb(shardId)

      await Promise.all(
        Object.entries(grouped).map(async ([uid, uidEntries]) => {
          const updates = uidEntries.reduce<Record<string, AuditEntry>>((acc, entry) => {
            acc[entry.id] = entry
            return acc
          }, {})
          await db.ref(`${this.RTDB_PATH}/${uid}`).update(updates)
        }),
      )
    } catch {
      this.fallbackQueue.unshift(...entries)
    } finally {
      if (this.flushTimer) clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  /** Generates a compact audit log id. */
  private generateId(): string {
    return nanoid(10)
  }
}
