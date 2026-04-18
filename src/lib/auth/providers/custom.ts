// Path: /src/lib/auth/providers/custom.ts
// Module: CustomCredentialsProviderFactory
// Depends on: next-auth/providers/credentials
// Description: Creates a basic credentials provider for local or custom auth flows.

import Credentials from 'next-auth/providers/credentials'

/** Returns a basic credentials provider. */
export function createCustomProvider() {
  return Credentials({
    id: 'custom',
    name: 'Custom',
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
