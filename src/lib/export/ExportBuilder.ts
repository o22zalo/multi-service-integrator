// Path: /src/lib/export/ExportBuilder.ts
// Module: ExportBuilder
// Depends on: @/services/_registry, ./formats/JsonExporter, ./formats/CsvExporter
// Description: Builds JSON or CSV exports from registered service modules.

import { ServiceRegistry } from '@/services/_registry'
import { SERVICE_META } from '@/services/_registry/serviceMeta'
import { buildCsvExport } from './formats/CsvExporter'
import { buildJsonExport } from './formats/JsonExporter'
import type { ExportOptions, ExportPayload } from './index'

export class ExportBuilder {
  /** Builds an export payload in the requested format. */
  async build(options: ExportOptions): Promise<ExportPayload | string> {
    const data = await this.collectData(options.uid, options.scope, options.ids)
    if (options.format === 'csv') {
      return buildCsvExport(data)
    }
    return buildJsonExport(data, options.uid, options.scope)
  }

  /** Collects raw encrypted service nodes for export. */
  private async collectData(uid: string, scope: string, ids?: string[]): Promise<Record<string, unknown>> {
    const types = scope === 'all' ? SERVICE_META.map((service) => service.type) : [scope]
    const output: Record<string, unknown> = {}

    for (const type of types) {
      if (!ServiceRegistry.has(type)) continue
      const service = ServiceRegistry.get(type)
      const payload = await service.export(uid, ids)
      output[type] = payload.data
    }

    return output
  }
}
