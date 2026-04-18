// Path: /src/app/api/services/import/route.ts
// Module: Import Route
// Depends on: @/lib/auth/withAuth, @/lib/export/ImportValidator, @/services/_registry, @/lib/utils/api
// Description: Imports JSON export payloads back into the user scope.

import { withAuth } from '@/lib/auth/withAuth'
import { ImportValidator } from '@/lib/export/ImportValidator'
import { ServiceRegistry } from '@/services/_registry'
import { fail, ok } from '@/lib/utils/api'
import type { ExportPayload } from '@/types/service'

export const POST = withAuth(async (req, { user }) => {
  const payload = await req.json().catch(() => null)
  const validation = new ImportValidator().validate(payload)
  if (!validation.valid) {
    return fail('IMPORT-VAL-001', 'Import payload validation failed', 400, validation)
  }

  const typed = payload as ExportPayload
  const importedServices = typed.scope === 'all' ? Object.keys(typed.data) : [typed.scope]
  let imported = 0

  for (const serviceType of importedServices) {
    if (!ServiceRegistry.has(serviceType)) continue
    const service = ServiceRegistry.get(serviceType)
    const servicePayload: ExportPayload = {
      ...typed,
      scope: serviceType,
      data: (typed.data[serviceType] as Record<string, unknown>) ?? {},
    }
    await service.import(user.uid, servicePayload)
    imported += Object.keys(servicePayload.data).length
  }

  return ok({ imported, skipped: 0, errors: [] })
})
