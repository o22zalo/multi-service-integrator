// Path: /src/app/api/services/[type]/[id]/route.ts
// Module: Service Detail Route
// Depends on: @/lib/auth/withAuth, @/services/_registry, @/lib/utils/api, @/lib/cache/ApiCache
// Description: Reads, updates, and deletes a single service account.
//              Write/delete operations invalidate the list cache.

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/_registry'
import { fail, maskSecret, ok } from '@/lib/utils/api'
import { getServiceFormFields } from '@/services/_registry/serviceForms'
import { ApiCache } from '@/lib/cache/ApiCache'

export const GET = withAuth(async (_req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)

  // Cache detail 60 giây
  const cacheKey = ApiCache.serviceDetailKey(user.uid, params.type, params.id)
  const account = await ApiCache.get(
    cacheKey,
    async () => {
      const loaded = await service.load(user.uid, params.id)
      const raw = await service.loadNode(user.uid, params.id)
      return { loaded, raw }
    },
    60_000,
  )

  const { loaded, raw } = account
  const maskedCredentials = Object.fromEntries(
    Object.entries(loaded.credentials).map(([key, value]) => [
      key,
      typeof value === 'string' ? maskSecret(value) : value,
    ]),
  )

  return ok({
    id: params.id,
    name: String(raw.node._meta.name ?? params.id),
    config: loaded.config,
    credentials: maskedCredentials,
    meta: raw.node._meta,
  })
})

export const PUT = withAuth(async (req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  const fields = getServiceFormFields(params.type)
  const body = await req.json().catch(() => null)
  if (!body) return fail('SERVICE-REQ-001', 'Invalid request payload', 400)

  const config: Record<string, unknown> = {}
  const credentials: Record<string, unknown> = {}

  for (const field of fields) {
    const value = body[field.name]
    if (value === undefined || value === '') continue
    if (field.section === 'config') config[field.name] = value
    if (field.section === 'credentials') credentials[field.name] = value
  }

  await service.update(user.uid, params.id, { name: body.name, config, credentials })

  // Invalidate cả list và detail cache
  ApiCache.invalidate(ApiCache.serviceListKey(user.uid, params.type))
  ApiCache.invalidate(ApiCache.serviceDetailKey(user.uid, params.type, params.id))

  return ok({ message: 'Account updated' })
})

export const DELETE = withAuth(async (_req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  await service.delete(user.uid, params.id)

  // Invalidate cache sau khi xóa
  ApiCache.invalidate(ApiCache.serviceListKey(user.uid, params.type))
  ApiCache.invalidate(ApiCache.serviceDetailKey(user.uid, params.type, params.id))

  return new Response(null, { status: 204 })
})
