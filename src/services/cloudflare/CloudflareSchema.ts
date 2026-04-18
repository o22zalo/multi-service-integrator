// Path: /src/services/cloudflare/CloudflareSchema.ts
// Module: Cloudflare Zod Schemas
// Depends on: zod
// Description: Validation schemas for Cloudflare flows.

import { z } from 'zod'

export const cloudflareCredentialSchema = z.object({
  email: z.string().email().optional(),
  api_token: z.string().optional(),
  api_key: z.string().optional(),
}).refine((value) => Boolean(value.api_token || (value.api_key && value.email)), {
  message: 'Provide api_token or api_key + email',
})
