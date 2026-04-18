// Path: /src/services/github/GithubSchema.ts
// Module: GitHub Zod Schemas
// Depends on: zod
// Description: Request validation schemas for GitHub service flows.

import { z } from 'zod'

export const githubCredentialSchema = z.object({
  email: z.string().email().optional(),
  token: z.string().min(10),
  webhook_secret: z.string().optional(),
})

export const createGithubHookSchema = z.object({
  repo_name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  contentType: z.enum(['json', 'form']).optional(),
})

export const createGithubSecretSchema = z.object({
  repo_name: z.string().min(1),
  secret_name: z.string().min(1),
  secret_value: z.string().min(1),
})

export const triggerGithubWorkflowSchema = z.object({
  repo_name: z.string().min(1),
  workflow_id: z.coerce.number().int().positive(),
  ref: z.string().min(1).default('main'),
})
