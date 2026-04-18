// Path: /src/types/global.d.ts
// Module: Global Environment Type Definitions
// Depends on: none
// Description: Shared environment variable declarations for the project.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AUTH_PROVIDERS: string
      NEXTAUTH_SECRET: string
      NEXTAUTH_URL: string
      FIREBASE_SHARD_COUNT: string
      [key: `FIREBASE_SHARD_${number}_PROJECT_ID`]: string
      [key: `FIREBASE_SHARD_${number}_DATABASE_URL`]: string
      [key: `FIREBASE_SHARD_${number}_SERVICE_ACCOUNT`]: string
      ENCRYPTION_KEY: string
      ENCRYPTION_IV_SALT: string
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string
      SUPABASE_URL?: string
      SUPABASE_ANON_KEY?: string
      SUPABASE_SERVICE_ROLE_KEY?: string
      NODE_ENV: 'development' | 'production' | 'test'
      NEXT_PUBLIC_APP_URL: string
    }
  }
}

export {}
