// Path: /src/services/supabase/SupabaseSchema.ts
// Module: Supabase Zod Schemas
// Depends on: zod
// Description: Validation schemas for Supabase service.

import { z } from 'zod'

export const supabaseCredentialSchema = z.object({
  service_role_key: z.string().min(10),
  anon_key: z.string().min(10),
  access_token: z.string().optional(),
})
