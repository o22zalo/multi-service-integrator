// Path: /src/lib/export/ImportValidator.ts
// Module: ImportValidator
// Depends on: crypto, zod
// Description: Validates JSON import payloads.

import { createHash } from 'crypto'
import { z } from 'zod'
import type { ExportPayload } from '@/types/service'
import type { ValidationResult } from './index'

const exportPayloadSchema = z.object({
  version: z.literal('1.0'),
  exported_at: z.string(),
  exported_by: z.string(),
  scope: z.string(),
  schema_version: z.literal('1'),
  data: z.record(z.string(), z.unknown()),
  checksum: z.string(),
})

export class ImportValidator {
  /** Validates a potential import payload. */
  validate(payload: unknown): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: ValidationResult['warnings'] = []

    const parsed = exportPayloadSchema.safeParse(payload)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        errors.push({ field: issue.path.join('.'), message: issue.message })
      })
      return { valid: false, errors, warnings }
    }

    if (!this.checkChecksum(parsed.data)) {
      errors.push({ field: 'checksum', message: 'Checksum mismatch' })
    }

    if (!this.checkSchemaVersion(parsed.data.schema_version)) {
      warnings.push({ field: 'schema_version', message: 'Unsupported schema version detected' })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /** Recomputes and verifies the export checksum. */
  private checkChecksum(payload: ExportPayload): boolean {
    const next = createHash('sha256').update(JSON.stringify(payload.data)).digest('hex')
    return next === payload.checksum
  }

  /** Returns true when the schema version is supported. */
  private checkSchemaVersion(version: string): boolean {
    return version === '1'
  }
}
