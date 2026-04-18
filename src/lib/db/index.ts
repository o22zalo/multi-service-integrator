// Path: /src/lib/db/index.ts
// Module: Local DB Types
// Depends on: none
// Description: Shared local cache and sync queue types.

export interface LocalService {
  id: string
  uid: string
  serviceType: string
  name: string
  shardId: string
  meta: Record<string, unknown>
  updatedAt: number
}

export interface LocalServiceDetail {
  id: string
  serviceId: string
  data: Record<string, unknown>
  updatedAt: number
}

export interface SyncQueueItem {
  id: string
  path: string
  data: unknown
  operation: 'set' | 'update' | 'delete'
  timestamp: number
  retries: number
  maxRetries: number
}

export * from './LocalDb'
export * from './SyncManager'
