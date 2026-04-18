// Path: /src/app/api/services/export/route.ts
// Module: Export Route
// Depends on: @/lib/auth/withAuth, @/lib/export/ExportBuilder, @/lib/utils/api
// Description: Builds JSON or CSV exports for one or all services.

import { withAuth } from '@/lib/auth/withAuth'
import { ExportBuilder } from '@/lib/export/ExportBuilder'
import { fail } from '@/lib/utils/api'

export const POST = withAuth(async (req, { user }) => {
  const body = await req.json().catch(() => null)
  if (!body?.scope || !body?.format) {
    return fail('EXPORT-REQ-001', 'scope and format are required', 400)
  }

  const result = await new ExportBuilder().build({
    scope: body.scope,
    format: body.format,
    ids: Array.isArray(body.ids) ? body.ids : undefined,
    uid: user.uid,
  })

  if (body.format === 'csv') {
    return new Response(result as string, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${body.scope}-export.csv"`,
      },
    })
  }

  return Response.json({ data: result })
})
