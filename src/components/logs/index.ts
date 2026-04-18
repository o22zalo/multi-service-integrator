// Path: /src/components/logs/index.ts
// Module: Log UI Types
// Depends on: @/lib/logger
// Description: Shared types for log UI components.

import type { OperationLog } from '@/lib/logger'

export interface LogFilters {
  action?: string
  from?: Date | null
  to?: Date | null
  serviceType?: string
  result?: 'SUCCESS' | 'FAILURE' | 'ALL'
}

export interface AuditLogTableProps {
  uid: string
  filters: LogFilters
}

export interface OperationLogDrawerProps {
  operation: OperationLog | null
  isOpen: boolean
  onClose: () => void
  onReplay?: (op: OperationLog) => void
}
