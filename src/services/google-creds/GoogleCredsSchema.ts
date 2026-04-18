// Path: /src/services/google-creds/GoogleCredsSchema.ts
// Module: Google Credentials Zod Schemas
// Depends on: zod
// Description: Validation schemas for Google credentials service.

import { z } from 'zod'

export const googleServiceAccountSchema = z.object({
  credential_type: z.literal('service_account'),
  json_key: z.string().min(10),
  project_id: z.string().optional(),
  client_email: z.string().optional(),
})
