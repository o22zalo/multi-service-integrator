// Path: /src/lib/logger/OperationLogger.ts
// Module: OperationLogger
// Depends on: nanoid, ../db/LocalDb, ../firebase/ShardManager, ./index
// Description: Local-first operation logging for API and sync actions.

import { nanoid } from 'nanoid'
import { db } from '../db/LocalDb'
import { ShardManager } from '../firebase/ShardManager'
import type { OperationLog } from './index'

interface OperationContext {
  end(result: 'SUCCESS' | 'FAILURE', extra?: Partial<OperationLog>): Promise<void>
}

export class OperationLogger {
  private static instance: OperationLogger | null = null

  /** Returns the singleton operation logger instance. */
  static getInstance(): OperationLogger {
    if (!OperationLogger.instance) {
      OperationLogger.instance = new OperationLogger()
    }
    return OperationLogger.instance
  }

  /** Saves an operation log locally first, then mirrors it to RTDB on a best-effort basis. */
  async logOperation(op: Omit<OperationLog, 'id' | 'timestamp'>): Promise<void> {
    const entry: OperationLog = {
      ...op,
      id: nanoid(10),
      timestamp: new Date().toISOString(),
    }

    await db.operation_logs.put(entry)

    try {
      const { getAdminDb } = await import('../firebase/FirebaseAdmin')
      const shardId = ShardManager.getInstance().getWriteShard().id
      await getAdminDb(shardId).ref(`/operation_logs/${entry.id}`).set(entry)
    } catch {
      // Local-first: swallow RTDB sync failures and keep the local log.
    }
  }

  /** Returns recent operation logs from IndexedDB. */
  async getRecentOps(limit = 50): Promise<OperationLog[]> {
    return db.operation_logs.orderBy('timestamp').reverse().limit(limit).toArray()
  }

  /** Starts a timed operation context that can be completed later. */
  startOperation(action: string, meta: Partial<OperationLog> = {}): OperationContext {
    const startedAt = Date.now()

    return {
      end: async (result, extra = {}) => {
        await this.logOperation({
          action,
          durationMs: extra.durationMs ?? Date.now() - startedAt,
          retryCount: extra.retryCount ?? meta.retryCount ?? 0,
          result,
          ...meta,
          ...extra,
        })
      },
    }
  }
}
