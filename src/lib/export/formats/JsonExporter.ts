// Path: /src/lib/export/formats/JsonExporter.ts
// Module: JsonExporter
// Depends on: crypto
// Description: Builds JSON export payloads with sha256 checksums.

import { createHash } from 'crypto'
import type { ExportPayload } from '@/types/service'

/** Builds a JSON export payload. */
export function buildJsonExport(data: Record<string, unknown>, uid: string, scope: string): ExportPayload {
  const checksum = createHash('sha256').update(JSON.stringify(data)).digest('hex')
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    exported_by: uid,
    scope,
    schema_version: '1',
    data,
    checksum,
  }
}
