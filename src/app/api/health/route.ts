// Path: /src/app/api/health/route.ts
// Module: Health Route
// Depends on: none
// Description: Lightweight health endpoint.

export async function GET() {
  return Response.json({ ok: true, timestamp: new Date().toISOString() })
}
