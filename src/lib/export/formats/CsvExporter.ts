// Path: /src/lib/export/formats/CsvExporter.ts
// Module: CsvExporter
// Depends on: none
// Description: Builds masked CSV exports from service data.

/** Builds a CSV string from export data. */
export function buildCsvExport(data: Record<string, unknown>): string {
  const rows = ['serviceType,id,name,status,createdAt,updatedAt,config,credentials']

  for (const [serviceType, records] of Object.entries(data)) {
    const entries = records as Record<string, Record<string, unknown>>
    for (const [id, record] of Object.entries(entries)) {
      const meta = record._meta as Record<string, unknown>
      const config = JSON.stringify(record.config ?? {}).replaceAll('"', '""')
      rows.push([
        serviceType,
        id,
        String(meta?.name ?? id),
        String(meta?.status ?? 'active'),
        String(meta?.created_at ?? ''),
        String(meta?.updated_at ?? ''),
        `"${config}"`,
        '***',
      ].join(','))
    }
  }

  return rows.join('\n')
}
