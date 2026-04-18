// Path: /src/app/api/services/[type]/[id]/sub/[subType]/[resourceId]/route.ts
// Module: Service Sub-Resource Detail Route
// Depends on: @/lib/auth/withAuth, @/services/_registry, @/lib/utils/api
// Description: Deletes a service sub-resource.

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/_registry'
import { fail } from '@/lib/utils/api'

export const DELETE = withAuth(async (req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  const url = new URL(req.url)
  const query = Object.fromEntries(url.searchParams.entries())
  await service.deleteSubResource(params.subType, params.id, user.uid, params.resourceId, query)
  return new Response(null, { status: 204 })
})
