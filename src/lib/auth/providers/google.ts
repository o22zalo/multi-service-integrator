// Path: /src/lib/auth/providers/google.ts
// Module: GoogleProviderFactory
// Depends on: next-auth/providers/google
// Description: Creates the Google auth provider when environment variables are available.

import Google from 'next-auth/providers/google'

/** Returns the Google provider or null when it is not configured. */
export function createGoogleProvider() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null
  return Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })
}
