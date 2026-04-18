// Path: /src/lib/auth/withAuth.ts
// Module: withAuth
// Depends on: ./auth
// Description: Wraps Route Handlers with a session and role guard.

import { auth } from './auth'

export interface AuthContext {
  uid: string
  email: string
  role: 'owner' | 'admin' | 'viewer'
}

export interface WithAuthOptions {
  role?: 'owner' | 'admin'
}

export type AuthenticatedHandler = (
  req: Request,
  ctx: { params: Record<string, string>; user: AuthContext }
) => Promise<Response>

/** Protects a route handler with session and optional role checks. */
export function withAuth(handler: AuthenticatedHandler, options: WithAuthOptions = {}) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    const session = await auth()
    if (!session?.user?.uid) {
      return Response.json({ error: { code: 'AUTH-JWT-001', message: 'Unauthorized' } }, { status: 401 })
    }

    const user: AuthContext = {
      uid: session.user.uid,
      email: session.user.email,
      role: session.user.role,
    }

    if (options.role === 'admin' && user.role !== 'admin' && user.role !== 'owner') {
      return Response.json({ error: { code: 'AUTH-ROLE-001', message: 'Forbidden' } }, { status: 403 })
    }

    if (options.role === 'owner' && user.role !== 'owner') {
      return Response.json({ error: { code: 'AUTH-ROLE-001', message: 'Forbidden' } }, { status: 403 })
    }

    return handler(req, { ...ctx, user })
  }
}
