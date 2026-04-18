// Path: /src/lib/auth/providers/supabase.ts
// Module: SupabaseCredentialsProviderFactory
// Depends on: next-auth/providers/credentials
// Description: Creates a lightweight credentials provider for Supabase-backed sign in.

import Credentials from 'next-auth/providers/credentials'

/** Returns a credentials provider for Supabase-style email/password sign-in. */
export function createSupabaseProvider() {
  return Credentials({
    id: 'supabase',
    name: 'Supabase',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email ? String(credentials.email) : ''
      const password = credentials?.password ? String(credentials.password) : ''
      if (!email || !password) return null
      return { id: email, email, name: email }
    },
  })
}
