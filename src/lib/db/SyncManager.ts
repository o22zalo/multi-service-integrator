// Path: /src/lib/db/SyncManager.ts
// Module: SyncManager
// Depends on: nanoid, ./LocalDb, ../firebase/ShardManager, ../firebase/FirebaseClient
// Description: Processes the local sync queue and mirrors changes to RTDB.

import { nanoid } from 'nanoid'
import { onValue, ref } from 'firebase/database'
import { db } from './LocalDb'
import type { SyncQueueItem } from './index'
import { ShardManager } from '../firebase/ShardManager'
import { getClientDb } from '../firebase/FirebaseClient'

export class SyncManager {
  private static instance: SyncManager | null = null
  private timer: NodeJS.Timeout | null = null
  private readonly INTERVAL_MS = 5000

  /** Returns the singleton sync manager instance. */
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /** Starts periodic queue processing. */
  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      void this.processQueue()
    }, this.INTERVAL_MS)
  }

  /** Stops periodic queue processing. */
  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  /** Adds a local change to the sync queue. */
  async markDirty(localId: string, path: string, data: unknown, operation: SyncQueueItem['operation']): Promise<void> {
    await db.sync_queue.put({
      id: nanoid(12),
      path,
      data,
      operation,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    })
  }

  /** Processes queued items sequentially. */
  async processQueue(): Promise<void> {
    const items = await db.sync_queue.orderBy('timestamp').toArray()
    for (const item of items) {
      await this.processItem(item)
    }
  }

  /** Subscribes to RTDB changes for a specific path. */
  onRTDBChange(path: string, cb: (data: unknown) => void): () => void {
    const shardId = ShardManager.getInstance().getWriteShard().id
    const unsubscribe = onValue(ref(getClientDb(shardId), path), (snapshot) => {
      cb(snapshot.val())
    })
    return () => unsubscribe()
  }

  /** Processes a single queued item and removes it on success. */
  private async processItem(item: SyncQueueItem): Promise<void> {
    try {
      const extracted = item.path.split('/').filter(Boolean)
      const shardId = ShardManager.getInstance().getWriteShard().id
      if (item.operation === 'delete') {
        await ShardManager.getInstance().delete(shardId, item.path)
      } else if (item.operation === 'update' && item.data && typeof item.data === 'object') {
        await ShardManager.getInstance().update(shardId, item.path, item.data as Record<string, unknown>)
      } else {
        await ShardManager.getInstance().write(item.path, item.data)
      }
      void extracted
      await db.sync_queue.delete(item.id)
    } catch {
      const retries = item.retries + 1
      if (retries >= item.maxRetries) {
        await db.sync_queue.delete(item.id)
        return
      }
      await db.sync_queue.put({ ...item, retries })
    }
  }

  /** Resolves conflicts using last-write-wins semantics. */
  private handleConflict(local: SyncQueueItem, remote: unknown): unknown {
    void remote
    return local.data
  }
}
