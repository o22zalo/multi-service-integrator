// Path: /src/app/api/services/[type]/[id]/route.ts
// Module: Service Detail Route
// Depends on: @/lib/auth/withAuth, @/services/_registry, @/lib/utils/api
// Description: Reads, updates, and deletes a single service account.

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/_registry'
import { fail, maskSecret, ok } from '@/lib/utils/api'
import { getServiceFormFields } from '@/services/_registry/serviceForms'

export const GET = withAuth(async (_req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  const account = await service.load(user.uid, params.id)
  const raw = await service.loadNode(user.uid, params.id)
  const maskedCredentials = Object.fromEntries(
    Object.entries(account.credentials).map(([key, value]) => [key, typeof value === 'string' ? maskSecret(value) : value]),
  )

  return ok({
    id: params.id,
    name: String(raw.node._meta.name ?? params.id),
    config: account.config,
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

  await service.update(user.uid, params.id, {
    name: body.name,
    config,
    credentials,
  })

  return ok({ message: 'Account updated' })
})

export const DELETE = withAuth(async (_req, { params, user }) => {
  if (!ServiceRegistry.has(params.type)) return fail('SERVICE-404', 'Service not registered', 404)
  const service = ServiceRegistry.get(params.type)
  await service.delete(user.uid, params.id)
  return new Response(null, { status: 204 })
})
