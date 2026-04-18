// Path: /src/lib/db/LocalDb.ts
// Module: LocalDb (Dexie)
// Depends on: dexie, ./index, ../logger/index
// Description: IndexedDB schema for local-first storage.

import Dexie, { type Table } from 'dexie'
import type { LocalService, LocalServiceDetail, SyncQueueItem } from './index'
import type { AuditEntry, OperationLog } from '../logger/index'

export class LocalDb extends Dexie {
  services!: Table<LocalService>
  service_details!: Table<LocalServiceDetail>
  audit_logs!: Table<AuditEntry>
  operation_logs!: Table<OperationLog>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('multi-service-integrator')
    this.version(1).stores({
      services: '&id, uid, serviceType, updatedAt',
      service_details: '&id, serviceId, updatedAt',
      audit_logs: '&id, actor, action, timestamp',
      operation_logs: '&id, timestamp',
      sync_queue: '&id, operation, timestamp, retries',
    })
  }
}

export const db = new LocalDb()
