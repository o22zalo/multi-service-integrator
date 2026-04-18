// Path: /src/app/api/auth/[...nextauth]/route.ts
// Module: NextAuthRoute
// Depends on: @/lib/auth/auth
// Description: Exposes GET/POST handlers for NextAuth.

import { handlers } from '@/lib/auth/auth'

export const { GET, POST } = handlers
