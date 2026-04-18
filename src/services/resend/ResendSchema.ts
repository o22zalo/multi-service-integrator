// Path: /src/services/resend/ResendSchema.ts
// Module: Resend Zod Schemas
// Depends on: zod
// Description: Validation schemas for Resend service.

import { z } from 'zod'

export const resendCredentialSchema = z.object({
  api_key: z.string().min(6),
})
