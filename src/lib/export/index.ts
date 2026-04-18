// Path: /src/lib/export/index.ts
// Module: Export Types
// Depends on: @/types/service
// Description: Types shared by export/import modules.

import type { ExportPayload, ServiceType } from '@/types/service'

export interface ExportOptions {
  scope: ServiceType | 'all' | string
  ids?: string[]
  format: 'json' | 'csv'
  uid: string
}

export interface ImportOptions {
  uid: string
  skipDuplicates?: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ field: string; message: string }>
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ id: string; error: string }>
}

export type { ExportPayload }
