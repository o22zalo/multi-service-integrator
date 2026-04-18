// Path: /src/lib/utils/api.ts
// Module: ApiResponseHelpers
// Depends on: none
// Description: Small helpers to keep Route Handler responses consistent.

/** Returns a successful JSON response in the project envelope format. */
export function ok<T>(data: T, init?: ResponseInit, meta?: Record<string, unknown>) {
  return Response.json({ data, ...(meta ? { meta } : {}) }, init)
}

/** Returns a failed JSON response in the project envelope format. */
export function fail(code: string, message: string, status = 400, details?: unknown) {
  return Response.json({ error: { code, message, ...(details !== undefined ? { details } : {}) } }, { status })
}

/** Masks a secret-like value for logs and preview UIs. */
export function maskSecret(value: string | null | undefined) {
  if (!value) return ''
  if (value.length <= 8) return '***'
  return `${value.slice(0, 4)}***${value.slice(-4)}`
}
