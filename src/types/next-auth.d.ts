// Path: /src/types/next-auth.d.ts
// Module: NextAuthTypes
// Depends on: next-auth
// Description: Extends Session and JWT with app-specific user metadata.

import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      uid: string
      email: string
      displayName?: string
      role: 'owner' | 'admin' | 'viewer'
      authProvider: 'google' | 'supabase' | 'custom'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string
    role?: 'owner' | 'admin' | 'viewer'
    authProvider?: 'google' | 'supabase' | 'custom'
  }
}

export {}
