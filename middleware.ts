// Path: /middleware.ts
// Module: AppMiddleware
// Depends on: @/lib/auth/auth, next/server
// Description: Guards dashboard and service API routes.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/auth'

/** Applies auth checks to dashboard and protected API routes. */
export default auth(function middleware(req: NextRequest & { auth?: any }) {
  const pathname = req.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isProtectedApi = pathname.startsWith('/api/services') || pathname.startsWith('/api/admin')

  if (!req.auth?.user?.uid) {
    if (isProtectedApi) {
      return NextResponse.json({ error: { code: 'AUTH-JWT-001', message: 'Unauthorized' } }, { status: 401 })
    }
    if (isDashboard) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/services/:path*', '/api/admin/:path*'],
}
