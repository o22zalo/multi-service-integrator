// Path: /src/app/api/services/[type]/[id]/sub/[subType]/route.ts
// Module: Service Sub-Resource Collection Route
// Depends on: @/lib/auth/withAuth, @/services/_registry, @/lib/utils/api
// Description: Lists and creates service sub-resources.

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/_registry'
import { fail, ok } from '@/lib/utils/api'

export const GET = withAuth(async (req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  const url = new URL(req.url)
  const query = Object.fromEntries(url.searchParams.entries())
  const resources = await service.fetchSubResources(params.subType, params.id, user.uid, query)
  return ok(resources)
})

export const POST = withAuth(async (req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  const body = await req.json().catch(() => null)
  const payload = body?.data ?? {}
  const result = await service.createSubResource(params.subType, params.id, user.uid, payload)

  if ('missing_fields' in result && result.missing_fields?.length) {
    return ok(result)
  }

  return ok({ resource: result }, { status: 201 })
})
