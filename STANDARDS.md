# /STANDARDS.md — Coding Standards

## 1. Naming Conventions
- Files: PascalCase for classes/components, camelCase for hooks/utils
- DB paths: `/{uid}/services/{service_type}/{record_id}`
- Env vars: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: PascalCase, prefix `I` is not used
- Error codes: `[MODULE]-[TYPE]-[3-digit-number]`

## 2. Error Code Registry
- `GH-AUTH-001` → GitHub token invalid
- `GH-AUTH-002` → GitHub token expired
- `GH-API-001` → GitHub rate limited
- `GH-API-002` → GitHub resource not found
- `GH-HOOK-001` → GitHub webhook invalid
- `CF-AUTH-001` → Cloudflare API auth failed
- `CF-API-001` → Cloudflare rate limited
- `CF-API-002` → Cloudflare resource not found
- `CF-TUN-001` → Cloudflare tunnel creation failed
- `SB-AUTH-001` → Supabase auth failed
- `SB-API-001` → Supabase project not found
- `SB-MGMT-001` → Supabase management token required
- `RS-AUTH-001` → Resend API key invalid
- `GC-AUTH-001` → Google credential invalid
- `GC-API-001` → Google insufficient permission
- `GC-SA-001` → Google service account JSON invalid
- `DB-SHARD-001` → No Firebase shards configured
- `DB-SHARD-002` → Shard not found
- `DB-SHARD-003` → No available shard
- `DB-READ-001` → Record not found
- `AUTH-JWT-001` → JWT missing or expired
- `AUTH-ROLE-001` → Insufficient role
- `ENC-AES-001` → AES decrypt failed
- `ENC-AES-002` → Invalid encryption key
- `LOG-AUDIT-001` → Audit logger flush failed

## 3. API Response Format
```ts
{ data?: T, error?: { code: string, message: string, details?: unknown }, meta?: { cursor?: string, total?: number, duration_ms?: number } }
```

## 4. Zod Schema Patterns
- Parse all request bodies at route boundaries.
- Use `.safeParse()` for user input and map failures to HTTP 400.
- Prefer explicit `z.object({...})` over permissive `z.any()`.
- Keep service-specific schemas inside each service folder.

## 5. Git Branching Strategy
- `main` → production
- `develop` → staging
- `feature/T-XXX-slug` → feature branches
- `fix/T-XXX-slug` → hotfix branches

## 6. PR/Review Checklist
- [ ] TypeScript strict mode respected
- [ ] No `any` without comment and reason
- [ ] Tests added or updated for new public logic
- [ ] Every write operation logs audit entry
- [ ] Secrets never hard-coded
- [ ] API routes validate input with Zod
- [ ] New env vars documented in `.env.example`

## 7. Service Module Layout
- `types.ts` → type definitions only
- `*Schema.ts` → Zod schemas only
- `*Api.ts` → external API adapters only
- `*Service.ts` → business logic only
- `index.ts` → public exports and optional registry side effects

## 8. Performance Rules
- Load lightweight IDs first, details later
- Cache details in IndexedDB with TTL
- Use optimistic local writes plus sync queue
- Prefer cursor pagination over offset pagination
- External API timeout: 30 seconds
- Retry external API calls up to 3 times with exponential backoff
