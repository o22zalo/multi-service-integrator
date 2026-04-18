// Path: /src/lib/logger/index.ts
// Module: Logger Types and Exports
// Depends on: @/types/service
// Description: Shared logger types and class exports.

import type { AuditEntry } from '@/types/service'

export interface AuditLogFilters {
  action?: AuditEntry['action']
  from?: string
  to?: string
  serviceType?: string
  result?: 'SUCCESS' | 'FAILURE'
  limit?: number
}

export interface OperationLog {
  id: string
  action: string
  serviceType?: string
  accountId?: string
  method?: string
  url?: string
  statusCode?: number
  requestHeaders?: Record<string, string>
  responseBody?: string
  durationMs: number
  retryCount: number
  result: 'SUCCESS' | 'FAILURE'
  error?: string
  timestamp: string
}

export interface LogBuffer {
  entries: AuditEntry[]
  flushAt: number
}

export type { AuditEntry }
export * from './AuditLogger'
export * from './OperationLogger'
