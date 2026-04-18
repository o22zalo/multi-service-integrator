plan.md — Kế hoạch triển khai chi tiết (Agent-Ready)
Path: /plan.md
Project: multi-service-integrator
Last updated: 2026-04-18
Version: 2.0 — Full spec với type definitions, function signatures, code skeleton, test cases
Đọc AGENTS.md trước khi thực hiện bất kỳ task nào.
🗺️ TỔNG QUAN KIẾN TRÚC
Multi-user SaaS · Next.js 15 App Router · Firebase RTDB Multi-Project · AES-256-GCM
Auth: NextAuth v5 (Google + Supabase + Custom) · Local-first (Zustand + IndexedDB/Dexie)
Multi-instance safe · Docker-ready · shadcn/ui · TypeScript strict
Nguyên tắc đọc plan này
Mỗi task có: Type Definitions → Function Signatures → Code Skeleton → Import Map → Test Cases
Agent đọc task → implement CHÍNH XÁC theo skeleton, không thêm không bớt
Skeleton dùng // TODO: implement để chỉ vùng agent phải điền code
Import map liệt kê ĐẦY ĐỦ import cần thiết cho mỗi file
📦 NHÓM TASK & DEPENDENCIES
Nhóm Tên Wave Parallel
0 Project Bootstrap 1 Không
1 Core Infrastructure 2 Không (sequential)
2 Auth System 3-4 Không
3 Service Framework 5 Có
4 Services MVP 7 Có (mỗi service độc lập)
5 Dashboard & UI 5,8 Có
6 Export/Import 9 Có
7 Performance & Polish 8 Có
8 DevOps & Docs Bất kỳ Có
═══════════════════════════════════════════════
🔵 NHÓM 0 — PROJECT BOOTSTRAP
═══════════════════════════════════════════════
T-001 · Khởi tạo Next.js project & cấu trúc thư mục
Status: TODO
Wave: 1
Phụ thuộc: Không
Agent: unassigned
Type Definitions
// /src/types/global.d.ts

declare global {
// Env helpers
namespace NodeJS {
interface ProcessEnv {
// Auth
AUTH_PROVIDERS: string // 'google,supabase,custom'
NEXTAUTH_SECRET: string
NEXTAUTH_URL: string

      // Firebase shards (N = 1, 2, 3, ...)
      FIREBASE_SHARD_COUNT: string
      [key: `FIREBASE_SHARD_${number}_PROJECT_ID`]: string
      [key: `FIREBASE_SHARD_${number}_DATABASE_URL`]: string
      [key: `FIREBASE_SHARD_${number}_SERVICE_ACCOUNT`]: string   // base64 JSON

      // Encryption
      ENCRYPTION_KEY: string               // 32-byte hex
      ENCRYPTION_IV_SALT: string           // 16-byte hex

      // Auth providers
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string
      SUPABASE_URL?: string
      SUPABASE_ANON_KEY?: string
      SUPABASE_SERVICE_ROLE_KEY?: string

      // App
      NODE_ENV: 'development' | 'production' | 'test'
      NEXT_PUBLIC_APP_URL: string
    }

}
}

export {}
// /src/types/service.d.ts

export type ServiceType =
| 'github'
| 'cloudflare'
| 'supabase'
| 'resend'
| 'google-creds'

export type ServiceStatus = 'active' | 'invalid' | 'pending' | 'error'

export interface ServiceListItem {
id: string
uid: string
serviceType: ServiceType
name: string
status: ServiceStatus
shardId: string
createdAt: string
updatedAt: string
}

export interface ServiceDetail extends ServiceListItem {
config: Record<string, unknown>
// credentials NOT included — always encrypted at rest
}

export interface SubResourceDef {
type: string
label: string
icon: string // lucide icon name
canCreate: boolean
canDelete: boolean
requiresInput?: string[] // field names needed before fetch
}

export interface ExportPayload {
version: '1.0'
exported_at: string // ISO8601
exported_by: string // uid
scope: ServiceType | 'all'
schema_version: '1'
data: Record<string, unknown>
checksum: string // sha256 hex
}

export interface ApiResponse<T = unknown> {
data?: T
error?: {
code: string // e.g. 'GH-AUTH-001'
message: string
details?: unknown
}
meta?: {
page?: number
cursor?: string
total?: number
duration_ms?: number
}
}

export interface AuditEntry {
id: string
action: 'SERVICE_CREATE' | 'SERVICE_UPDATE' | 'SERVICE_DELETE' | 'API_CALL' | 'EXPORT' | 'IMPORT'
actor: string // uid
target: {
type: string
id: string
}
payload?: {
before?: unknown
after?: unknown
}
result: 'SUCCESS' | 'FAILURE'
errorCode?: string
durationMs: number
timestamp: string // ISO8601
}
Files cần tạo
/package.json
/tsconfig.json
/next.config.ts
/tailwind.config.ts
/postcss.config.js
/.env.example
/.gitignore
/.cursorrules
/src/app/layout.tsx
/src/app/page.tsx
/src/app/globals.css
/src/types/global.d.ts
/src/types/service.d.ts
/STANDARDS.md
Code Skeleton
// /next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
experimental: {
serverComponentsExternalPackages: ['firebase-admin'],
},
images: {
remotePatterns: [
{ protocol: 'https', hostname: 'avatars.githubusercontent.com' },
{ protocol: 'https', hostname: 'lh3.googleusercontent.com' },
],
},
}

export default nextConfig
// /src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
title: 'Multi-Service Integrator',
description: 'Centralized credential & service management',
}

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {
return (
<html lang="en" suppressHydrationWarning>
<body className={inter.className}>{children}</body>
</html>
)
}
// /src/app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
redirect('/dashboard')
}
// package.json (key sections)
{
"name": "multi-service-integrator",
"version": "0.1.0",
"private": true,
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"typecheck": "tsc --noEmit",
"test": "jest",
"test:unit": "jest tests/unit",
"test:integration": "jest tests/integration"
},
"dependencies": {
"next": "^15.0.0",
"react": "^19.0.0",
"react-dom": "^19.0.0",
"typescript": "^5.0.0",
"firebase": "^10.0.0",
"firebase-admin": "^12.0.0",
"next-auth": "^5.0.0",
"zustand": "^4.0.0",
"dexie": "^3.0.0",
"zod": "^3.0.0",
"axios": "^1.0.0",
"date-fns": "^3.0.0",
"lucide-react": "^0.400.0",
"nanoid": "^5.0.0",
"tailwindcss": "^3.4.0",
"@tailwindcss/forms": "^0.5.0",
"class-variance-authority": "^0.7.0",
"clsx": "^2.0.0",
"tailwind-merge": "^2.0.0"
},
"devDependencies": {
"@types/node": "^20.0.0",
"@types/react": "^19.0.0",
"@types/react-dom": "^19.0.0",
"jest": "^29.0.0",
"@types/jest": "^29.0.0",
"ts-jest": "^29.0.0",
"jest-environment-node": "^29.0.0",
"eslint": "^8.0.0",
"eslint-config-next": "^15.0.0"
}
}
Import Map (per file)
/src/app/layout.tsx → next/font/google, ./globals.css
/src/app/page.tsx → next/navigation
/src/types/global.d.ts → (no imports — declarations only)
/src/types/service.d.ts → (no imports — type exports only)
/next.config.ts → next (type only)
/tailwind.config.ts → tailwindcss/types/config
Điều kiện hoàn thành & Test Cases
✅ TC-001-01: npx tsc --noEmit exits 0
✅ TC-001-02: npm run dev starts on port 3000
✅ TC-001-03: GET / returns 308 redirect to /dashboard
✅ TC-001-04: All directories in AGENTS.md section 3 exist
✅ TC-001-05: .env.example has all keys from AGENTS.md section 8
✅ TC-001-06: package.json has all required dependencies
═══════════════════════════════════════════════
🟣 NHÓM 1 — CORE INFRASTRUCTURE
═══════════════════════════════════════════════
T-101 · Firebase Multi-Project ShardManager
Status: TODO
Wave: 2
Phụ thuộc: T-001
Agent: unassigned
Type Definitions
// Types used within /src/lib/firebase/

export interface ShardConfig {
id: string // 'shard_1', 'shard_2', ...
projectId: string
databaseUrl: string
serviceAccountBase64: string
capacity: number // max records, default 100_000
currentLoad: number // fetched from /meta/load
isAvailable: boolean
}

export interface WriteResult {
shardId: string
path: string
key: string // generated push key or provided
}

export interface ReadResult<T = unknown> {
data: T
shardId: string
path: string
}

export interface ShardIndexEntry {
shardId: string
createdAt: string
}

export interface RTDBNode {
\_meta: {
created_at: string
updated_at: string
version: number
schema_v: string
}
credentials: Record<string, string> // always AES encrypted
config: Record<string, unknown>
sub_resources?: Record<string, Record<string, unknown>>
}

export interface HealthStatus {
shardId: string
isHealthy: boolean
latencyMs?: number
error?: string
checkedAt: string
}
Function Signatures
// /src/lib/firebase/ShardManager.ts

class ShardManager {
private static instance: ShardManager | null = null
private shards: Map<string, ShardConfig>
private healthCache: Map<string, HealthStatus>

private constructor()

static getInstance(): ShardManager

// Shard selection
getWriteShard(): ShardConfig
getReadShard(shardId: string): ShardConfig

// Core operations
write(path: string, data: unknown): Promise<WriteResult>
read<T>(uid: string, service: string, recordId: string): Promise<ReadResult<T>>
list(uid: string, service: string): Promise<Array<{ id: string; shardId: string }>>
delete(shardId: string, path: string): Promise<void>
update(shardId: string, path: string, data: Partial<RTDBNode>): Promise<void>

// Index management
private writeShardIndex(uid: string, service: string, recordId: string, shardId: string): Promise<void>
private readShardIndex(uid: string, service: string, recordId: string): Promise<string | null>

// Health
checkHealth(): Promise<HealthStatus[]>
private pingWithTimeout(shardId: string, timeoutMs?: number): Promise<HealthStatus>
private loadShardsFromEnv(): ShardConfig[]
}
// /src/lib/firebase/ShardSelector.ts

class ShardSelector {
selectShard(shards: ShardConfig[]): ShardConfig
private weightedRoundRobin(available: ShardConfig[]): ShardConfig
}
// /src/lib/firebase/FirebaseAdmin.ts

function getAdminApp(shardId: string): App
function getAdminDb(shardId: string): Database
function initializeAdminApp(config: ShardConfig): App
// /src/lib/firebase/FirebaseClient.ts

function getClientDb(shardId: string): Database
function initializeClientApp(config: Pick<ShardConfig, 'id' | 'projectId' | 'databaseUrl'>): Database
Code Skeleton
// /src/lib/firebase/ShardManager.ts
// Path: /src/lib/firebase/ShardManager.ts
// Module: Firebase ShardManager
// Depends on: /src/lib/firebase/FirebaseAdmin.ts, /src/lib/firebase/ShardSelector.ts
// Description: Singleton quản lý nhiều Firebase RTDB project

import { getAdminDb } from './FirebaseAdmin'
import { ShardSelector } from './ShardSelector'
import type { ShardConfig, WriteResult, ReadResult, HealthStatus, RTDBNode } from './index'

const selector = new ShardSelector()

export class ShardManager {
private static instance: ShardManager | null = null
private shards: Map<string, ShardConfig> = new Map()
private healthCache: Map<string, HealthStatus> = new Map()

private constructor() {
const loaded = this.loadShardsFromEnv()
loaded.forEach(s => this.shards.set(s.id, s))
if (this.shards.size === 0) {
throw new Error('DB-SHARD-001: No Firebase shards configured')
}
}

static getInstance(): ShardManager {
if (!ShardManager.instance) {
ShardManager.instance = new ShardManager()
}
return ShardManager.instance
}

getWriteShard(): ShardConfig {
const available = Array.from(this.shards.values()).filter(s => s.isAvailable)
if (available.length === 0) throw new Error('DB-SHARD-003: No available shard')
return selector.selectShard(available)
}

getReadShard(shardId: string): ShardConfig {
const shard = this.shards.get(shardId)
if (!shard) throw new Error(`DB-SHARD-002: Shard ${shardId} not found`)
return shard
}

async write(path: string, data: unknown): Promise<WriteResult> {
// TODO: implement
// 1. getWriteShard()
// 2. getAdminDb(shard.id).ref(path).push(data)
// 3. return WriteResult { shardId, path, key }
throw new Error('Not implemented')
}

async read<T>(uid: string, service: string, recordId: string): Promise<ReadResult<T>> {
// TODO: implement
// 1. readShardIndex(uid, service, recordId) → shardId
// 2. getAdminDb(shardId).ref(`/${uid}/services/${service}/${recordId}`).get()
// 3. return ReadResult
throw new Error('Not implemented')
}

async list(uid: string, service: string): Promise<Array<{ id: string; shardId: string }>> {
// TODO: implement
// 1. getAdminDb(any shard).ref(`/shard_index/${uid}/${service}`).get()
// 2. Return array of { id, shardId } — NO full objects
throw new Error('Not implemented')
}

async delete(shardId: string, path: string): Promise<void> {
// TODO: implement
// 1. getAdminDb(shardId).ref(path).remove()
throw new Error('Not implemented')
}

async update(shardId: string, path: string, data: Partial<RTDBNode>): Promise<void> {
// TODO: implement
// 1. getAdminDb(shardId).ref(path).update({ ...data, '\_meta/updated_at': new Date().toISOString() })
throw new Error('Not implemented')
}

private async writeShardIndex(uid: string, service: string, recordId: string, shardId: string): Promise<void> {
// TODO: implement
// Write to /shard_index/{uid}/{service}/{recordId} = { shardId, createdAt }
throw new Error('Not implemented')
}

private async readShardIndex(uid: string, service: string, recordId: string): Promise<string | null> {
// TODO: implement
// Read from /shard_index/{uid}/{service}/{recordId}, return shardId or null
throw new Error('Not implemented')
}

async checkHealth(): Promise<HealthStatus[]> {
// TODO: implement
// Ping each shard with 5s timeout, update isAvailable
throw new Error('Not implemented')
}

private async pingWithTimeout(shardId: string, timeoutMs = 5000): Promise<HealthStatus> {
// TODO: implement
// Race: db.ref('/.info/connected').get() vs setTimeout
throw new Error('Not implemented')
}

private loadShardsFromEnv(): ShardConfig[] {
// TODO: implement
// Loop N=1,2,3... while FIREBASE_SHARD_N_PROJECT_ID exists
// Return ShardConfig[] with isAvailable: true, currentLoad: 0, capacity: 100_000
throw new Error('Not implemented')
}
}
// /src/lib/firebase/ShardSelector.ts
// Path: /src/lib/firebase/ShardSelector.ts
// Module: ShardSelector
// Description: Round-robin + capacity-weighted shard selection

import type { ShardConfig } from './index'

export class ShardSelector {
private cursor = 0

selectShard(shards: ShardConfig[]): ShardConfig {
// TODO: implement
// Filter shards where currentLoad / capacity < 0.9
// Round-robin among eligible shards
// Fallback: lowest load shard
throw new Error('Not implemented')
}

private weightedRoundRobin(available: ShardConfig[]): ShardConfig {
// TODO: implement
// Use cursor, increment, mod by length
throw new Error('Not implemented')
}
}
// /src/lib/firebase/FirebaseAdmin.ts
// Path: /src/lib/firebase/FirebaseAdmin.ts
// Module: FirebaseAdmin
// Description: firebase-admin initialization per shard

import \* as admin from 'firebase-admin'
import type { App } from 'firebase-admin/app'
import type { Database } from 'firebase-admin/database'
import type { ShardConfig } from './index'

const apps: Map<string, App> = new Map()

export function getAdminApp(shardId: string): App {
// TODO: implement
// Return from cache or throw if not initialized
throw new Error('Not implemented')
}

export function getAdminDb(shardId: string): Database {
// TODO: implement
// getAdminApp(shardId) → admin.database(app)
throw new Error('Not implemented')
}

export function initializeAdminApp(config: ShardConfig): App {
// TODO: implement
// Decode base64 service account → JSON
// admin.initializeApp({ credential, databaseURL }, config.id)
// Store in apps Map
throw new Error('Not implemented')
}
Import Map
ShardManager.ts → firebase-admin/database, ./FirebaseAdmin, ./ShardSelector, ./index (types)
ShardSelector.ts → ./index (types)
FirebaseAdmin.ts → firebase-admin, firebase-admin/app, firebase-admin/database, ./index (types)
FirebaseClient.ts → firebase/app, firebase/database, ./index (types)
index.ts → re-export all from above
Test Cases
// /tests/unit/ShardManager.test.ts

describe('ShardManager', () => {
// TC-101-01: Singleton pattern
test('getInstance returns same instance', () => {
const a = ShardManager.getInstance()
const b = ShardManager.getInstance()
expect(a).toBe(b)
})

// TC-101-02: Throws when no shards configured
test('throws DB-SHARD-001 when no env vars', () => {
// Clear env, re-instantiate
expect(() => new (ShardManager as any)()).toThrow('DB-SHARD-001')
})

// TC-101-03: list() returns only IDs
test('list() returns array of {id, shardId} without full objects', async () => {
const manager = ShardManager.getInstance()
const result = await manager.list('user123', 'github')
result.forEach(item => {
expect(item).toHaveProperty('id')
expect(item).toHaveProperty('shardId')
expect(item).not.toHaveProperty('credentials')
expect(item).not.toHaveProperty('config')
})
})

// TC-101-04: write → read round trip
test('write then read returns same data', async () => {
const manager = ShardManager.getInstance()
const testData = { name: 'test-account', config: { owner: 'user' } }
const writeResult = await manager.write('/users/uid1/services/github/rec1', testData)
const readResult = await manager.read('uid1', 'github', 'rec1')
expect(readResult.data).toMatchObject(testData)
expect(readResult.shardId).toBe(writeResult.shardId)
})

// TC-101-05: health check
test('checkHealth returns array with isHealthy field', async () => {
const manager = ShardManager.getInstance()
const statuses = await manager.checkHealth()
expect(Array.isArray(statuses)).toBe(true)
statuses.forEach(s => {
expect(s).toHaveProperty('shardId')
expect(s).toHaveProperty('isHealthy')
expect(s).toHaveProperty('checkedAt')
})
})

// TC-101-06: getWriteShard throws when all shards unavailable
test('getWriteShard throws DB-SHARD-003 when no available shards', () => {
const manager = ShardManager.getInstance()
// Mark all shards unavailable
;(manager as any).shards.forEach((s: ShardConfig) => s.isAvailable = false)
expect(() => manager.getWriteShard()).toThrow('DB-SHARD-003')
})
})
T-102 · AES-256 Crypto Module
Status: TODO
Wave: 2
Phụ thuộc: T-001
Agent: unassigned
Type Definitions
// /src/lib/crypto/index.ts exports

export interface EncryptResult {
ciphertext: string // base64(iv + authTag + encrypted)
algorithm: 'aes-256-gcm'
}

export interface DecryptInput {
ciphertext: string
}

// Map service type → fields to encrypt
export const ENCRYPTED_FIELDS: Record<string, string[]> = {
'github': ['token', 'webhook_secret'],
'cloudflare': ['api_key', 'api_token'],
'supabase': ['service_role_key', 'anon_key', 'access_token'],
'resend': ['api_key'],
'google-creds': ['client_secret', 'json_key', 'key'],
}
Function Signatures
// /src/lib/crypto/AesCrypto.ts

export function encrypt(plaintext: string, keyHex?: string): string
// Returns: base64(12-byte-iv + 16-byte-authTag + ciphertext)
// Throws: ENC-AES-002 if key invalid

export function decrypt(ciphertext: string, keyHex?: string): string
// Throws: ENC-AES-001 if decrypt fails (wrong key / tampered)

export function encryptObject<T extends Record<string, unknown>>(
obj: T,
fields: string[]
): T
// Returns new object with specified fields encrypted, others untouched

export function decryptObject<T extends Record<string, unknown>>(
obj: T,
fields: string[]
): T
// Returns new object with specified fields decrypted

// /src/lib/crypto/FieldEncryptor.ts

export function encryptService<T extends Record<string, unknown>>(
serviceType: string,
data: T
): T

export function decryptService<T extends Record<string, unknown>>(
serviceType: string,
data: T
): T
Code Skeleton
// /src/lib/crypto/AesCrypto.ts
// Path: /src/lib/crypto/AesCrypto.ts
// Module: AES-256-GCM Crypto
// Depends on: Node.js built-in 'crypto'
// Description: Encrypt/decrypt secrets using AES-256-GCM

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16 // 128-bit auth tag

function getKey(keyHex?: string): Buffer {
const hex = keyHex ?? process.env.ENCRYPTION_KEY
if (!hex || hex.length !== 64) {
throw new Error('ENC-AES-002: Invalid encryption key — must be 32-byte hex (64 chars)')
}
return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string, keyHex?: string): string {
// TODO: implement
// 1. getKey(keyHex)
// 2. randomBytes(IV_LENGTH) → iv
// 3. createCipheriv(ALGORITHM, key, iv) → cipher
// 4. cipher.update(plaintext, 'utf8') + cipher.final()
// 5. cipher.getAuthTag() → authTag
// 6. Buffer.concat([iv, authTag, encrypted]).toString('base64')
throw new Error('Not implemented')
}

export function decrypt(ciphertext: string, keyHex?: string): string {
// TODO: implement
// 1. Buffer.from(ciphertext, 'base64') → buf
// 2. buf.slice(0, IV_LENGTH) → iv
// 3. buf.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH) → authTag
// 4. buf.slice(IV_LENGTH + AUTH_TAG_LENGTH) → encrypted
// 5. createDecipheriv → decipher.setAuthTag(authTag)
// 6. decipher.update + decipher.final → plaintext
// 7. Wrap in try/catch → throw 'ENC-AES-001: Decrypt failed'
throw new Error('Not implemented')
}

export function encryptObject<T extends Record<string, unknown>>(
obj: T,
fields: string[]
): T {
// TODO: implement
// Return { ...obj, ...fields.reduce((acc, f) => obj[f] ? { ...acc, [f]: encrypt(String(obj[f])) } : acc, {}) }
throw new Error('Not implemented')
}

export function decryptObject<T extends Record<string, unknown>>(
obj: T,
fields: string[]
): T {
// TODO: implement
// Same pattern as encryptObject but decrypt
throw new Error('Not implemented')
}
// /src/lib/crypto/FieldEncryptor.ts
// Path: /src/lib/crypto/FieldEncryptor.ts
// Module: FieldEncryptor
// Depends on: ./AesCrypto
// Description: Service-aware field encryption

import { encryptObject, decryptObject, ENCRYPTED_FIELDS } from './AesCrypto'

export function encryptService<T extends Record<string, unknown>>(
serviceType: string,
data: T
): T {
// TODO: implement
// const fields = ENCRYPTED_FIELDS[serviceType] ?? []
// return encryptObject(data, fields)
throw new Error('Not implemented')
}

export function decryptService<T extends Record<string, unknown>>(
serviceType: string,
data: T
): T {
// TODO: implement
throw new Error('Not implemented')
}
Import Map
AesCrypto.ts → crypto (Node.js built-in)
FieldEncryptor.ts → ./AesCrypto
index.ts → re-export { encrypt, decrypt, encryptObject, decryptObject, encryptService, decryptService, ENCRYPTED_FIELDS }
Test Cases
// /tests/unit/AesCrypto.test.ts

describe('AesCrypto', () => {
const TEST_KEY = 'a'.repeat(64) // 32 bytes hex

// TC-102-01: Round trip
test('encrypt then decrypt returns original', () => {
const original = 'my-secret-token-123'
const encrypted = encrypt(original, TEST_KEY)
const decrypted = decrypt(encrypted, TEST_KEY)
expect(decrypted).toBe(original)
})

// TC-102-02: Different ciphertext each call (random IV)
test('same plaintext gives different ciphertext each call', () => {
const plain = 'same-input'
const c1 = encrypt(plain, TEST_KEY)
const c2 = encrypt(plain, TEST_KEY)
expect(c1).not.toBe(c2)
})

// TC-102-03: Wrong key throws ENC-AES-001
test('decrypt with wrong key throws ENC-AES-001', () => {
const encrypted = encrypt('secret', TEST_KEY)
const wrongKey = 'b'.repeat(64)
expect(() => decrypt(encrypted, wrongKey)).toThrow('ENC-AES-001')
})

// TC-102-04: Invalid key throws ENC-AES-002
test('encrypt with invalid key throws ENC-AES-002', () => {
expect(() => encrypt('secret', 'tooshort')).toThrow('ENC-AES-002')
})

// TC-102-05: encryptObject only encrypts specified fields
test('encryptObject encrypts only listed fields', () => {
const obj = { token: 'secret', name: 'public', extra: 'data' }
const result = encryptObject(obj, ['token'])
expect(result.token).not.toBe('secret')
expect(result.name).toBe('public')
expect(result.extra).toBe('data')
})

// TC-102-06: Object round trip
test('encryptObject → decryptObject returns original', () => {
const obj = { token: 'my-token', webhook_secret: 'wh-secret', name: 'github-main' }
const fields = ['token', 'webhook_secret']
const encrypted = encryptObject(obj, fields)
const decrypted = decryptObject(encrypted, fields)
expect(decrypted).toEqual(obj)
})

// TC-102-07: Key not in output
test('ciphertext does not contain the key', () => {
const encrypted = encrypt('data', TEST_KEY)
expect(encrypted).not.toContain(TEST_KEY)
})
})
T-103 · Audit Logger
Status: TODO
Wave: 2
Phụ thuộc: T-101
Agent: unassigned
Type Definitions
// /src/lib/logger/index.ts exports

export interface AuditLogFilters {
action?: AuditEntry['action']
from?: string // ISO8601
to?: string // ISO8601
serviceType?: string
result?: 'SUCCESS' | 'FAILURE'
limit?: number // default 50, max 500
}

export interface OperationLog {
id: string
action: string
serviceType?: string
accountId?: string
method?: string
url?: string
statusCode?: number
requestHeaders?: Record<string, string>
responseBody?: string // truncated to 1000 chars
durationMs: number
retryCount: number
result: 'SUCCESS' | 'FAILURE'
error?: string
timestamp: string
}

export interface LogBuffer {
entries: AuditEntry[]
flushAt: number // flush when entries.length >= flushAt
}
Function Signatures
// /src/lib/logger/AuditLogger.ts

class AuditLogger {
private static instance: AuditLogger | null = null
private buffer: AuditEntry[]
private readonly FLUSH_SIZE = 10
private readonly RTDB_PATH = '/audit_logs'

static getInstance(): AuditLogger

log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void>
// Adds id (nanoid), timestamp, pushes to buffer, flushes if needed

getLogs(uid: string, filters?: AuditLogFilters): Promise<AuditEntry[]>

private flush(): Promise<void>
// Batch write buffer to RTDB

private generateId(): string
// nanoid(10)
}

// /src/lib/logger/OperationLogger.ts

class OperationLogger {
static getInstance(): OperationLogger

logOperation(op: Omit<OperationLog, 'id' | 'timestamp'>): Promise<void>
// Save to local IndexedDB immediately, sync RTDB async

getRecentOps(limit?: number): Promise<OperationLog[]>
// From local IndexedDB, sorted by timestamp DESC

startOperation(action: string, meta?: Partial<OperationLog>): OperationContext
// Returns context with .end(result, extra?) method
}

interface OperationContext {
end(result: 'SUCCESS' | 'FAILURE', extra?: Partial<OperationLog>): Promise<void>
}
Code Skeleton
// /src/lib/logger/AuditLogger.ts
// Path: /src/lib/logger/AuditLogger.ts
// Module: AuditLogger
// Depends on: /src/lib/firebase/ShardManager.ts, nanoid
// Description: Buffered audit logging to Firebase RTDB

import { nanoid } from 'nanoid'
import { ShardManager } from '../firebase/ShardManager'
import type { AuditEntry, AuditLogFilters } from './index'

export class AuditLogger {
private static instance: AuditLogger | null = null
private buffer: AuditEntry[] = []
private readonly FLUSH_SIZE = 10
private readonly RTDB_PATH = '/audit_logs'
private flushTimer: NodeJS.Timeout | null = null

private constructor() {}

static getInstance(): AuditLogger {
if (!AuditLogger.instance) {
AuditLogger.instance = new AuditLogger()
}
return AuditLogger.instance
}

async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
// TODO: implement
// 1. Create full entry: { ...entry, id: nanoid(10), timestamp: new Date().toISOString() }
// 2. Push to buffer
// 3. If buffer.length >= FLUSH_SIZE → flush()
// 4. Else set/reset debounce timer (2s) → flush()
throw new Error('Not implemented')
}

async getLogs(uid: string, filters: AuditLogFilters = {}): Promise<AuditEntry[]> {
// TODO: implement
// 1. ShardManager.getInstance().getAdminDb(any).ref(`${RTDB_PATH}/${uid}`).orderByChild('timestamp')
// 2. Apply from/to date range filters
// 3. Apply action, serviceType, result filters
// 4. Limit results
throw new Error('Not implemented')
}

private async flush(): Promise<void> {
// TODO: implement
// 1. Snapshot buffer, clear buffer
// 2. Group by uid
// 3. For each uid: batch write to RTDB /audit_logs/{uid}/{entry.id}
// 4. If RTDB offline: store in local fallback (in-memory queue)
// 5. Clear flush timer
throw new Error('Not implemented')
}

private generateId(): string {
return nanoid(10)
}
}
Import Map
AuditLogger.ts → nanoid, ../firebase/ShardManager, ./index (types)
OperationLogger.ts → nanoid, ../db/LocalDb, ../firebase/ShardManager, ./index (types)
index.ts → re-export { AuditLogger, OperationLogger } + types
Test Cases
// /tests/unit/AuditLogger.test.ts

describe('AuditLogger', () => {
const mockEntry = {
action: 'SERVICE_CREATE' as const,
actor: 'user-123',
target: { type: 'github', id: 'acc-456' },
result: 'SUCCESS' as const,
durationMs: 150,
}

// TC-103-01: Singleton
test('getInstance returns same instance', () => {
expect(AuditLogger.getInstance()).toBe(AuditLogger.getInstance())
})

// TC-103-02: log() does not throw when RTDB offline
test('log() queues entry without throwing when offline', async () => {
// Mock RTDB to throw network error
await expect(AuditLogger.getInstance().log(mockEntry)).resolves.not.toThrow()
})

// TC-103-03: getLogs() filter by action
test('getLogs filters by action correctly', async () => {
const logger = AuditLogger.getInstance()
const logs = await logger.getLogs('user-123', { action: 'SERVICE_CREATE' })
logs.forEach(l => expect(l.action).toBe('SERVICE_CREATE'))
})

// TC-103-04: getLogs() filter by date range
test('getLogs filters by date range', async () => {
const logger = AuditLogger.getInstance()
const from = '2026-01-01T00:00:00Z'
const to = '2026-12-31T23:59:59Z'
const logs = await logger.getLogs('user-123', { from, to })
logs.forEach(l => {
expect(new Date(l.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(from).getTime())
expect(new Date(l.timestamp).getTime()).toBeLessThanOrEqual(new Date(to).getTime())
})
})

// TC-103-05: Buffer flushes at FLUSH_SIZE
test('buffer flushes when 10 entries accumulated', async () => {
const logger = AuditLogger.getInstance()
const flushSpy = jest.spyOn(logger as any, 'flush')
for (let i = 0; i < 10; i++) {
await logger.log(mockEntry)
}
expect(flushSpy).toHaveBeenCalled()
})
})
T-104 · Local Cache (Zustand + IndexedDB)
Status: TODO
Wave: 2
Phụ thuộc: T-001
Agent: unassigned
Type Definitions
// /src/lib/db/index.ts

export interface LocalService {
id: string
uid: string
serviceType: string
name: string
shardId: string
meta: Record<string, unknown>
updatedAt: number // Unix timestamp ms
}

export interface LocalServiceDetail {
id: string // = serviceId
serviceId: string
data: Record<string, unknown>
updatedAt: number
}

export interface SyncQueueItem {
id: string
path: string
data: unknown
operation: 'set' | 'update' | 'delete'
timestamp: number
retries: number
maxRetries: number
}

// /src/lib/store/index.ts

export interface AppState {
currentUser: { uid: string; email: string; displayName?: string; role: string } | null
isLoading: boolean
notifications: Notification[]
setCurrentUser: (user: AppState['currentUser']) => void
addNotification: (n: Omit<Notification, 'id'>) => void
removeNotification: (id: string) => void
setLoading: (v: boolean) => void
}

export interface Notification {
id: string
type: 'success' | 'error' | 'info' | 'warning'
message: string
duration?: number
}

export interface ServiceState {
serviceIds: string[]
selectedServiceId: string | null
serviceDetails: Map<string, LocalServiceDetail>
isLoadingIds: boolean
isLoadingDetail: Record<string, boolean>
loadServiceIds: (uid: string, serviceType: string) => Promise<void>
loadServiceDetail: (id: string) => Promise<void>
updateService: (id: string, data: Partial<LocalServiceDetail>) => void
selectService: (id: string | null) => void
reset: () => void
}
Function Signatures
// /src/lib/db/LocalDb.ts

class LocalDb extends Dexie {
services!: Table<LocalService>
service_details!: Table<LocalServiceDetail>
audit_logs!: Table<AuditEntry>
operation_logs!: Table<OperationLog>
sync_queue!: Table<SyncQueueItem>

constructor()
// version(1).stores(schema)
}

export const db: LocalDb

// /src/lib/db/SyncManager.ts

class SyncManager {
private static instance: SyncManager | null = null
private timer: NodeJS.Timeout | null = null
private readonly INTERVAL_MS = 5000

static getInstance(): SyncManager
start(): void
stop(): void
markDirty(localId: string, path: string, data: unknown, operation: SyncQueueItem['operation']): Promise<void>
processQueue(): Promise<void>
onRTDBChange(path: string, cb: (data: unknown) => void): () => void // returns unsubscribe fn
private processItem(item: SyncQueueItem): Promise<void>
private handleConflict(local: SyncQueueItem, remote: unknown): unknown // last-write-wins
}
Code Skeleton
// /src/lib/db/LocalDb.ts
// Path: /src/lib/db/LocalDb.ts
// Module: LocalDb (Dexie)
// Depends on: dexie
// Description: IndexedDB schema for local-first storage

import Dexie, { type Table } from 'dexie'
import type { LocalService, LocalServiceDetail, SyncQueueItem } from './index'
import type { AuditEntry } from '../logger/index'
import type { OperationLog } from '../logger/index'

export class LocalDb extends Dexie {
services!: Table<LocalService>
service_details!: Table<LocalServiceDetail>
audit_logs!: Table<AuditEntry>
operation_logs!: Table<OperationLog>
sync_queue!: Table<SyncQueueItem>

constructor() {
super('multi-service-integrator')
// TODO: implement
// this.version(1).stores({
// services: '&id, uid, serviceType, updatedAt',
// service_details: '&id, serviceId, updatedAt',
// audit_logs: '&id, uid, action, timestamp',
// operation_logs: '&id, timestamp',
// sync_queue: '++id, operation, timestamp, retries',
// })
}
}

export const db = new LocalDb()
// /src/lib/store/AppStore.ts
// Path: /src/lib/store/AppStore.ts
// Module: AppStore (Zustand)
// Depends on: zustand, zustand/middleware, nanoid
// Description: Global app state — user, loading, notifications

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { AppState } from './index'

export const useAppStore = create<AppState>()(
persist(
(set, get) => ({
currentUser: null,
isLoading: false,
notifications: [],

      setCurrentUser: (user) => {
        // TODO: implement → set({ currentUser: user })
      },

      addNotification: (n) => {
        // TODO: implement
        // set({ notifications: [...get().notifications, { ...n, id: nanoid() }] })
        // If n.duration → setTimeout to remove
      },

      removeNotification: (id) => {
        // TODO: implement
        // set({ notifications: get().notifications.filter(n => n.id !== id) })
      },

      setLoading: (v) => {
        // TODO: implement → set({ isLoading: v })
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }

)
)
// /src/lib/store/ServiceStore.ts
// Path: /src/lib/store/ServiceStore.ts
// Module: ServiceStore (Zustand)
// Depends on: zustand, ../db/LocalDb, ../firebase/ShardManager
// Description: Per-service state management — IDs first, details lazy

import { create } from 'zustand'
import { db } from '../db/LocalDb'
import { ShardManager } from '../firebase/ShardManager'
import type { ServiceState } from './index'

export const useServiceStore = create<ServiceState>()((set, get) => ({
serviceIds: [],
selectedServiceId: null,
serviceDetails: new Map(),
isLoadingIds: false,
isLoadingDetail: {},

loadServiceIds: async (uid: string, serviceType: string) => {
// TODO: implement
// 1. set({ isLoadingIds: true })
// 2. Try local DB first: db.services.where({ uid, serviceType }).primaryKeys()
// 3. In background: ShardManager.getInstance().list(uid, serviceType) → sync to DB
// 4. set({ serviceIds: ids, isLoadingIds: false })
},

loadServiceDetail: async (id: string) => {
// TODO: implement
// 1. Check if already in serviceDetails Map → return early
// 2. set({ isLoadingDetail: { ...get().isLoadingDetail, [id]: true } })
// 3. Try db.service_details.get(id) first
// 4. If not found: fetch from RTDB, save to db
// 5. Update serviceDetails Map
},

updateService: (id, data) => {
// TODO: implement
// Update serviceDetails Map + mark dirty in sync queue
},

selectService: (id) => {
// TODO: implement → set({ selectedServiceId: id })
// If id !== null → trigger loadServiceDetail(id) if not cached
},

reset: () => {
// TODO: implement → set initial state
},
}))
Import Map
LocalDb.ts → dexie
SyncManager.ts → ./LocalDb, ../firebase/ShardManager, ../firebase/FirebaseClient, nanoid
AppStore.ts → zustand, zustand/middleware, nanoid, ./index (types)
ServiceStore.ts → zustand, ../db/LocalDb, ../firebase/ShardManager, ./index (types)
index.ts → export { db } from LocalDb, { SyncManager } from SyncManager
Test Cases
// /tests/unit/LocalDb.test.ts

describe('LocalDb', () => {
// TC-104-01: Dexie initializes without error
test('db initializes without throwing', () => {
expect(() => new LocalDb()).not.toThrow()
})

// TC-104-02: Tables exist
test('all required tables exist', () => {
expect(db.services).toBeDefined()
expect(db.service_details).toBeDefined()
expect(db.audit_logs).toBeDefined()
expect(db.operation_logs).toBeDefined()
expect(db.sync_queue).toBeDefined()
})
})

describe('SyncManager', () => {
// TC-104-03: Singleton
test('getInstance returns same instance', () => {
expect(SyncManager.getInstance()).toBe(SyncManager.getInstance())
})

// TC-104-04: processQueue handles empty queue gracefully
test('processQueue resolves when queue is empty', async () => {
await expect(SyncManager.getInstance().processQueue()).resolves.not.toThrow()
})

// TC-104-05: markDirty adds to sync_queue
test('markDirty adds item to sync_queue', async () => {
const sm = SyncManager.getInstance()
await sm.markDirty('id1', '/path/to/node', { test: true }, 'set')
const count = await db.sync_queue.count()
expect(count).toBeGreaterThan(0)
})
})

describe('ServiceStore', () => {
// TC-104-06: Initial state
test('initial state has empty serviceIds', () => {
const { serviceIds } = useServiceStore.getState()
expect(serviceIds).toEqual([])
})

// TC-104-07: selectService updates selectedServiceId
test('selectService updates selectedServiceId', () => {
useServiceStore.getState().selectService('acc-123')
expect(useServiceStore.getState().selectedServiceId).toBe('acc-123')
})

// TC-104-08: reset clears state
test('reset returns to initial state', () => {
useServiceStore.getState().selectService('some-id')
useServiceStore.getState().reset()
expect(useServiceStore.getState().selectedServiceId).toBeNull()
})
})
═══════════════════════════════════════════════
🟡 NHÓM 2 — AUTH SYSTEM
═══════════════════════════════════════════════
T-201 · NextAuth v5 Multi-Provider Setup
Status: TODO
Wave: 3
Phụ thuộc: T-101, T-104
Agent: unassigned
Type Definitions
// Session & JWT types

declare module 'next-auth' {
interface Session {
user: {
uid: string
email: string
displayName?: string
role: 'owner' | 'admin' | 'viewer'
authProvider: 'google' | 'supabase' | 'custom'
}
}
interface JWT {
uid: string
role: 'owner' | 'admin' | 'viewer'
authProvider: 'google' | 'supabase' | 'custom'
}
}

// RTDB user node
export interface RTDBUser {
uid: string
email: string
displayName?: string
role: 'owner' | 'admin' | 'viewer'
lastLogin: string // ISO8601
authProvider: string
createdAt: string
}

// Login page data
export interface EnabledProviders {
google: boolean
supabase: boolean
custom: boolean
}
Function Signatures
// /src/lib/auth/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth(config)

// /src/lib/auth/AuthAdapter.ts
export async function upsertUserToRTDB(user: {
uid: string
email: string
displayName?: string
authProvider: string
}): Promise<RTDBUser>

export async function getUserFromRTDB(uid: string): Promise<RTDBUser | null>

// /src/lib/auth/providers/google.ts
export function createGoogleProvider(): Provider

// /src/lib/auth/providers/supabase.ts
export function createSupabaseProvider(): Provider

// /src/lib/auth/providers/custom.ts
export function createCustomProvider(): Provider
Code Skeleton
// /src/lib/auth/auth.ts
// Path: /src/lib/auth/auth.ts
// Module: NextAuth Configuration
// Depends on: next-auth, ./providers/\*, ./AuthAdapter
// Description: NextAuth v5 config — multi-provider, JWT strategy

import NextAuth from 'next-auth'
import { createGoogleProvider } from './providers/google'
import { createSupabaseProvider } from './providers/supabase'
import { createCustomProvider } from './providers/custom'
import { upsertUserToRTDB } from './AuthAdapter'

function getEnabledProviders() {
const list = (process.env.AUTH_PROVIDERS ?? '').split(',').map(s => s.trim())
const providers = []
if (list.includes('google')) providers.push(createGoogleProvider())
if (list.includes('supabase')) providers.push(createSupabaseProvider())
if (list.includes('custom')) providers.push(createCustomProvider())
return providers
}

export const { handlers, auth, signIn, signOut } = NextAuth({
providers: getEnabledProviders(),
session: { strategy: 'jwt' },

callbacks: {
async jwt({ token, user, account }) {
// TODO: implement
// On first sign in: user is defined
// token.uid = user.id ?? token.sub
// token.role = 'owner' (default for new users)
// token.authProvider = account?.provider ?? 'custom'
// await upsertUserToRTDB({ uid: token.uid, email: token.email!, ... })
return token
},

    async session({ session, token }) {
      // TODO: implement
      // session.user.uid = token.uid
      // session.user.role = token.role
      // session.user.authProvider = token.authProvider
      return session
    },

},

pages: {
signIn: '/login',
error: '/login',
},
})
// /src/lib/auth/providers/google.ts
// Path: /src/lib/auth/providers/google.ts
// Module: Google OAuth Provider
// Depends on: next-auth/providers/google
// Description: Google OAuth2 — openid email profile

import Google from 'next-auth/providers/google'

export function createGoogleProvider() {
return Google({
clientId: process.env.GOOGLE_CLIENT_ID!,
clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
authorization: {
params: { scope: 'openid email profile' },
},
})
}
// /src/lib/auth/providers/supabase.ts
// Path: /src/lib/auth/providers/supabase.ts
// Module: Supabase Auth Provider
// Depends on: next-auth/providers/credentials, @supabase/supabase-js
// Description: Credentials provider using Supabase auth

import Credentials from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const loginSchema = z.object({
email: z.string().email(),
password: z.string().min(6),
})

export function createSupabaseProvider() {
return Credentials({
id: 'supabase',
name: 'Supabase',
credentials: {
email: { label: 'Email', type: 'email' },
password: { label: 'Password', type: 'password' },
},
async authorize(credentials) {
// TODO: implement
// 1. loginSchema.safeParse(credentials) — return null if invalid
// 2. createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// 3. supabase.auth.signInWithPassword({ email, password })
// 4. Return { id: user.id, email: user.email } or null
return null
},
})
}
// /src/lib/auth/AuthAdapter.ts
// Path: /src/lib/auth/AuthAdapter.ts
// Module: AuthAdapter
// Depends on: ../firebase/ShardManager, nanoid
// Description: Upsert user data into RTDB after successful auth

import { ShardManager } from '../firebase/ShardManager'
import { nanoid } from 'nanoid'
import type { RTDBUser } from './index'

export async function upsertUserToRTDB(user: {
uid: string
email: string
displayName?: string
authProvider: string
}): Promise<RTDBUser> {
// TODO: implement
// 1. ShardManager read existing user from /users/{uid}
// 2. If exists: update lastLogin only
// 3. If not: create with role: 'owner', createdAt: now
// 4. Write back to /users/{uid}
// 5. Return RTDBUser
throw new Error('Not implemented')
}

export async function getUserFromRTDB(uid: string): Promise<RTDBUser | null> {
// TODO: implement
// Read /users/{uid} → return or null
throw new Error('Not implemented')
}
// /src/app/(auth)/login/page.tsx
// Path: /src/app/(auth)/login/page.tsx
// Module: Login Page
// Depends on: next-auth/react, next/navigation, ../../../lib/auth/auth
// Description: Login page — dynamic provider buttons + credential form

'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState<string | null>(null)

// TODO: implement
// Fetch /api/auth/providers to get enabled list
// Render buttons per enabled provider
// Show email/password form if 'custom' or 'supabase' enabled

return (
<div className="min-h-screen flex items-center justify-center bg-slate-950">
{/_ TODO: render login UI _/}
</div>
)
}
Import Map
auth.ts → next-auth, ./providers/google, ./providers/supabase, ./providers/custom, ./AuthAdapter
providers/google.ts → next-auth/providers/google
providers/supabase.ts → next-auth/providers/credentials, @supabase/supabase-js, zod
providers/custom.ts → next-auth/providers/credentials, zod, ../firebase/ShardManager
AuthAdapter.ts → ../firebase/ShardManager, nanoid
api/auth/[...nextauth]/route.ts → ../../lib/auth/auth (handlers)
login/page.tsx → next-auth/react, next/navigation, react
Test Cases
// /tests/unit/AuthAdapter.test.ts

describe('AuthAdapter', () => {
// TC-201-01: upsertUserToRTDB creates user with role 'owner'
test('creates new user with owner role', async () => {
const user = await upsertUserToRTDB({
uid: 'test-uid-001',
email: 'test@example.com',
authProvider: 'google',
})
expect(user.role).toBe('owner')
expect(user.uid).toBe('test-uid-001')
expect(user.createdAt).toBeDefined()
})

// TC-201-02: upsertUserToRTDB updates lastLogin on re-login
test('updates lastLogin without changing role on re-login', async () => {
const uid = 'existing-uid'
await upsertUserToRTDB({ uid, email: 'e@e.com', authProvider: 'google' })
const first = await getUserFromRTDB(uid)
// Wait a ms
await new Promise(r => setTimeout(r, 10))
await upsertUserToRTDB({ uid, email: 'e@e.com', authProvider: 'google' })
const second = await getUserFromRTDB(uid)
expect(second!.lastLogin).not.toBe(first!.lastLogin)
expect(second!.role).toBe(first!.role)
})

// TC-201-03: getUserFromRTDB returns null for unknown uid
test('returns null for unknown uid', async () => {
const result = await getUserFromRTDB('nonexistent-uid-xyz')
expect(result).toBeNull()
})
})
T-202 · Auth Middleware & Route Protection
Status: TODO
Wave: 4
Phụ thuộc: T-201
Agent: unassigned
Type Definitions
// /src/lib/auth/withAuth.ts

export interface AuthContext {
uid: string
email: string
role: 'owner' | 'admin' | 'viewer'
}

export interface WithAuthOptions {
role?: 'admin' | 'owner' // required minimum role
}

export type AuthenticatedHandler = (
req: Request,
ctx: { params: Record<string, string>; user: AuthContext }
) => Promise<Response>
Function Signatures
// /middleware.ts
export default function middleware(request: NextRequest): NextResponse | void

export const config = {
matcher: ['/(dashboard|api/services|api/admin)/:path*']
}

// /src/lib/auth/withAuth.ts
export function withAuth(
handler: AuthenticatedHandler,
options?: WithAuthOptions
): (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>

// /src/lib/auth/RtdbRules.ts
export function generateRtdbRules(): object
export function exportRulesAsJson(): string
Code Skeleton
// /middleware.ts
// Path: /middleware.ts
// Module: Next.js Middleware
// Depends on: next-auth, next/server
// Description: Route protection — verify JWT, inject x-user-id header

import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(function middleware(req) {
// TODO: implement
// 1. Check req.auth (set by NextAuth middleware)
// 2. If no session: return NextResponse.redirect('/login') for dashboard routes
// or NextResponse.json({ error: 'AUTH-JWT-001' }, { status: 401 }) for API routes
// 3. If session: clone headers, add x-user-id, x-user-role, x-user-email
// 4. return NextResponse.next({ request: { headers } })
})

export const config = {
matcher: ['/(dashboard)/:path*', '/api/(services|admin)/:path*'],
}
// /src/lib/auth/withAuth.ts
// Path: /src/lib/auth/withAuth.ts
// Module: withAuth HOC
// Depends on: next-auth, next/headers
// Description: Wrapper for API route handlers — inject authenticated user

import { auth } from './auth'
import type { AuthenticatedHandler, WithAuthOptions, AuthContext } from './index'

export function withAuth(
handler: AuthenticatedHandler,
options: WithAuthOptions = {}
) {
return async (req: Request, ctx: { params: Record<string, string> }) => {
// TODO: implement
// 1. const session = await auth() — get server session
// 2. If !session: return Response.json({ error: { code: 'AUTH-JWT-001', message: 'Unauthorized' } }, { status: 401 })
// 3. If options.role && session.user.role !== options.role: return 403
// 4. const user: AuthContext = { uid: session.user.uid, email: session.user.email, role: session.user.role }
// 5. return handler(req, { ...ctx, user })
return Response.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 })
}
}
Import Map
middleware.ts → next-auth, @/lib/auth/auth, next/server
withAuth.ts → ./auth, next/headers
RtdbRules.ts → (no external deps — generates static JSON)
Test Cases
// /tests/unit/withAuth.test.ts

describe('withAuth', () => {
// TC-202-01: Returns 401 when no session
test('returns 401 when session missing', async () => {
// Mock auth() to return null
const handler = withAuth(async (req, ctx) => Response.json({ ok: true }))
const res = await handler(new Request('http://localhost/api/test'), { params: {} })
expect(res.status).toBe(401)
const body = await res.json()
expect(body.error.code).toBe('AUTH-JWT-001')
})

// TC-202-02: Injects user into context
test('injects uid into handler context', async () => {
let capturedUid = ''
// Mock auth() to return valid session
const handler = withAuth(async (req, ctx) => {
capturedUid = (ctx as any).user.uid
return Response.json({ ok: true })
})
await handler(new Request('http://localhost/api/test'), { params: {} })
expect(capturedUid).toBeTruthy()
})

// TC-202-03: Role check returns 403 for insufficient role
test('returns 403 when role insufficient', async () => {
// Mock session with role: 'viewer'
const handler = withAuth(async () => Response.json({}), { role: 'admin' })
const res = await handler(new Request('http://localhost'), { params: {} })
expect(res.status).toBe(403)
})

// TC-202-04: /login is not protected
test('middleware passes through /login without auth', async () => {
// Test by checking matcher pattern does not include /login
const matcher = '/api/(services|admin)/:path\*'
expect(matcher).not.toContain('login')
})
})
═══════════════════════════════════════════════
🟠 NHÓM 3 — SERVICE FRAMEWORK
═══════════════════════════════════════════════
T-301 · BaseService Abstract Class & ServiceRegistry
Status: TODO
Wave: 5
Phụ thuộc: T-101, T-102, T-103
Agent: unassigned
Type Definitions
// /src/services/\_base/BaseSchema.ts

export interface ServiceListItem {
id: string
uid: string
serviceType: string
name: string
status: 'active' | 'invalid' | 'pending' | 'error'
shardId: string
createdAt: string
updatedAt: string
// NO credentials here
}

export interface ServiceSaveInput<TConfig, TCred> {
name: string
config: TConfig
credentials: TCred
}

export interface ServiceSaveResult {
id: string
shardId: string
}

// /src/services/\_registry/ServiceRegistry.ts

export interface ServiceMeta {
type: string
label: string
icon: string
description: string
}
Function Signatures
// /src/services/\_base/BaseService.ts

abstract class BaseService<TConfig, TCredential, TSubResource> {
// Constants — must override
abstract readonly SERVICE_TYPE: string
abstract readonly SERVICE_LABEL: string
abstract readonly CREDENTIAL_FIELDS: string[]
abstract readonly ICON: string
abstract readonly DESCRIPTION: string

// Must implement
abstract validateCredentials(creds: TCredential): Promise<boolean>
abstract fetchMetadata(creds: TCredential): Promise<Partial<TConfig>>
abstract getSubResourceTypes(): SubResourceDef[]
abstract fetchSubResources(type: string, accountId: string, uid: string): Promise<TSubResource[]>
abstract createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>): Promise<TSubResource>
abstract deleteSubResource(type: string, accountId: string, uid: string, id: string): Promise<void>

// Implemented by base — do NOT override
async save(uid: string, input: ServiceSaveInput<TConfig, TCredential>): Promise<ServiceSaveResult>
async load(uid: string, id: string): Promise<{ config: TConfig; credentials: TCredential }>
async list(uid: string): Promise<ServiceListItem[]>
async delete(uid: string, id: string): Promise<void>
async export(uid: string, ids?: string[]): Promise<ExportPayload>
async import(uid: string, payload: ExportPayload): Promise<void>
protected buildMeta(extra?: Record<string, unknown>): RTDBNode['_meta']
}
Code Skeleton
// /src/services/\_base/BaseService.ts
// Path: /src/services/\_base/BaseService.ts
// Module: BaseService
// Depends on: ../../lib/firebase/ShardManager, ../../lib/crypto/FieldEncryptor,
// ../../lib/logger/AuditLogger, nanoid
// Description: Abstract base for all service implementations

import { ShardManager } from '../../lib/firebase/ShardManager'
import { encryptService, decryptService } from '../../lib/crypto/FieldEncryptor'
import { AuditLogger } from '../../lib/logger/AuditLogger'
import { nanoid } from 'nanoid'
import type { ServiceListItem, ServiceSaveInput, ServiceSaveResult, SubResourceDef } from './BaseSchema'
import type { ExportPayload, RTDBNode } from '../../types/service'

export abstract class BaseService<
TConfig extends Record<string, unknown>,
TCredential extends Record<string, unknown>,
TSubResource extends Record<string, unknown>

> {
> abstract readonly SERVICE_TYPE: string
> abstract readonly SERVICE_LABEL: string
> abstract readonly CREDENTIAL_FIELDS: string[]
> abstract readonly ICON: string
> abstract readonly DESCRIPTION: string

abstract validateCredentials(creds: TCredential): Promise<boolean>
abstract fetchMetadata(creds: TCredential): Promise<Partial<TConfig>>
abstract getSubResourceTypes(): SubResourceDef[]
abstract fetchSubResources(type: string, accountId: string, uid: string): Promise<TSubResource[]>
abstract createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>): Promise<TSubResource>
abstract deleteSubResource(type: string, accountId: string, uid: string, id: string): Promise<void>

// ─────────────────────────────────────────
// Implemented by base — do NOT override
// ─────────────────────────────────────────

async save(uid: string, input: ServiceSaveInput<TConfig, TCredential>): Promise<ServiceSaveResult> {
// TODO: implement
// 1. const id = nanoid(16)
// 2. const encryptedCreds = encryptService(this.SERVICE_TYPE, input.credentials)
// 3. const node: RTDBNode = { \_meta: this.buildMeta(), credentials: encryptedCreds, config: input.config }
// 4. const result = await ShardManager.getInstance().write(`/${uid}/services/${this.SERVICE_TYPE}/${id}`, node)
// 5. await AuditLogger.getInstance().log({ action: 'SERVICE_CREATE', actor: uid, target: { type: this.SERVICE_TYPE, id }, payload: { after: input.config }, result: 'SUCCESS', durationMs: 0 })
// 6. return { id, shardId: result.shardId }
throw new Error('Not implemented')
}

async load(uid: string, id: string): Promise<{ config: TConfig; credentials: TCredential }> {
// TODO: implement
// 1. ShardManager.getInstance().read(uid, this.SERVICE_TYPE, id)
// 2. Decrypt: decryptService(this.SERVICE_TYPE, data.credentials)
// 3. Return { config: data.config, credentials: decrypted }
throw new Error('Not implemented')
}

async list(uid: string): Promise<ServiceListItem[]> {
// TODO: implement
// 1. ShardManager.getInstance().list(uid, this.SERVICE_TYPE) → [{ id, shardId }]
// 2. For each: read minimal fields from /shard_index or a summary doc
// 3. NEVER include credentials in return
throw new Error('Not implemented')
}

async delete(uid: string, id: string): Promise<void> {
// TODO: implement
// 1. ShardManager.getInstance().read to get shardId
// 2. ShardManager.delete(shardId, `/${uid}/services/${this.SERVICE_TYPE}/${id}`)
// 3. Delete shard index entry
// 4. Audit log
throw new Error('Not implemented')
}

async export(uid: string, ids?: string[]): Promise<ExportPayload> {
// TODO: implement — export encrypted (never plaintext)
throw new Error('Not implemented')
}

async import(uid: string, payload: ExportPayload): Promise<void> {
// TODO: implement
throw new Error('Not implemented')
}

protected buildMeta(extra?: Record<string, unknown>): RTDBNode['_meta'] {
return {
created_at: new Date().toISOString(),
updated_at: new Date().toISOString(),
version: 1,
schema_v: '1',
...extra,
}
}
}
// /src/services/\_registry/ServiceRegistry.ts
// Path: /src/services/\_registry/ServiceRegistry.ts
// Module: ServiceRegistry
// Depends on: ../\*/index (auto-import all services)
// Description: Central registry for all service implementations

import type { BaseService } from '../\_base/BaseService'
import type { ServiceMeta } from './index'

type AnyService = BaseService<any, any, any>

class ServiceRegistryImpl {
private registry: Map<string, AnyService> = new Map()

register(service: AnyService): void {
// TODO: implement → this.registry.set(service.SERVICE_TYPE, service)
}

get(type: string): AnyService {
// TODO: implement
// const s = this.registry.get(type)
// if (!s) throw new Error(`Service '${type}' not registered`)
// return s
throw new Error('Not implemented')
}

list(): ServiceMeta[] {
// TODO: implement
// return Array.from(this.registry.values()).map(s => ({
// type: s.SERVICE_TYPE, label: s.SERVICE_LABEL, icon: s.ICON, description: s.DESCRIPTION
// }))
throw new Error('Not implemented')
}

has(type: string): boolean {
return this.registry.has(type)
}
}

// Singleton export
export const ServiceRegistry = new ServiceRegistryImpl()
Import Map
BaseService.ts → ../../lib/firebase/ShardManager, ../../lib/crypto/FieldEncryptor,
../../lib/logger/AuditLogger, nanoid, ./BaseSchema, ../../types/service
BaseApi.ts → axios, ../../lib/logger/OperationLogger
BaseSchema.ts → zod
ServiceRegistry.ts → ../\_base/BaseService, ./index
index.ts (registry) → ./ServiceRegistry + all service imports for auto-registration
Test Cases
// /tests/unit/BaseService.test.ts

class MockService extends BaseService<
{ owner: string },
{ token: string },
{ id: string; name: string }

> {
> readonly SERVICE_TYPE = 'mock'
> readonly SERVICE_LABEL = 'Mock'
> readonly CREDENTIAL_FIELDS = ['token']
> readonly ICON = 'box'
> readonly DESCRIPTION = 'Mock service for testing'

async validateCredentials(creds: { token: string }) {
return creds.token === 'valid-token'
}

async fetchMetadata(creds: { token: string }) {
return { owner: 'test-owner' }
}

getSubResourceTypes() { return [] }
async fetchSubResources() { return [] }
async createSubResource() { return { id: '1', name: 'r' } }
async deleteSubResource() {}
}

describe('BaseService', () => {
const service = new MockService()

// TC-301-01: save() encrypts credential fields
test('save encrypts CREDENTIAL_FIELDS', async () => {
const spy = jest.spyOn(require('../../lib/crypto/FieldEncryptor'), 'encryptService')
await service.save('uid1', { name: 'test', config: { owner: 'me' }, credentials: { token: 'secret' } })
expect(spy).toHaveBeenCalledWith('mock', expect.objectContaining({ token: 'secret' }))
})

// TC-301-02: list() returns no credentials
test('list() does not return credential data', async () => {
const items = await service.list('uid1')
items.forEach(item => {
expect(item).not.toHaveProperty('credentials')
expect(item).not.toHaveProperty('token')
})
})

// TC-301-03: ServiceRegistry registers and retrieves
test('ServiceRegistry.get returns registered service', () => {
ServiceRegistry.register(service)
expect(ServiceRegistry.get('mock')).toBe(service)
})

// TC-301-04: ServiceRegistry.list returns meta
test('ServiceRegistry.list returns correct meta fields', () => {
const list = ServiceRegistry.list()
const mock = list.find(s => s.type === 'mock')
expect(mock).toBeDefined()
expect(mock?.label).toBe('Mock')
expect(mock?.icon).toBe('box')
})

// TC-301-05: Save → load round trip decrypts credentials
test('save then load returns decrypted credentials', async () => {
const { id } = await service.save('uid1', {
name: 'my-mock',
config: { owner: 'user' },
credentials: { token: 'my-plain-token' },
})
const loaded = await service.load('uid1', id)
expect(loaded.credentials.token).toBe('my-plain-token')
})
})
T-302 · Generic API Routes cho mọi Service
Status: TODO
Wave: 6
Phụ thuộc: T-301, T-202
Agent: unassigned
Type Definitions
// Shared request/response shapes

export interface CreateAccountRequest {
name: string
config: Record<string, unknown>
credentials: Record<string, unknown>
}

export interface CreateAccountResponse {
id: string
shardId: string
message: string
}

export interface FetchMetadataResponse {
updated_fields: string[]
duration_ms: number
}

export interface SubResourceCreateRequest {
data: Record<string, unknown>
}

export interface SubResourceCreateResponse {
resource?: unknown
missing_fields?: string[]
defaults?: Record<string, unknown>
}

export interface ImportResponse {
imported: number
skipped: number
errors: Array<{ id: string; error: string }>
}
Code Skeleton
// /src/app/api/services/[type]/route.ts
// Path: /src/app/api/services/[type]/route.ts
// Module: Service list/create API
// Depends on: ../../../../lib/auth/withAuth, ../../../../services/\_registry/ServiceRegistry, zod
// Description: GET list accounts, POST create account

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/\_registry/ServiceRegistry'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const createSchema = z.object({
name: z.string().min(1).max(100),
config: z.record(z.unknown()),
credentials: z.record(z.unknown()),
})

export const GET = withAuth(async (req, { params, user }) => {
// TODO: implement
// 1. const service = ServiceRegistry.get(params.type) — catch → 404
// 2. const items = await service.list(user.uid)
// 3. Return ApiResponse<ServiceListItem[]>
return Response.json({ data: [], meta: {} })
})

export const POST = withAuth(async (req, { params, user }) => {
// TODO: implement
// 1. const body = await req.json()
// 2. const parsed = createSchema.safeParse(body)
// If !parsed.success → return 400 with validation errors
// 3. const service = ServiceRegistry.get(params.type)
// 4. const isValid = await service.validateCredentials(parsed.data.credentials)
// If !isValid → return 400 with code GH-AUTH-001 (service-specific)
// 5. const meta = await service.fetchMetadata(parsed.data.credentials)
// 6. const result = await service.save(user.uid, { ...parsed.data, config: { ...parsed.data.config, ...meta } })
// 7. Return 201 with { id, shardId, message: 'Account created' }
return Response.json({ data: null }, { status: 501 })
})
// /src/app/api/services/[type]/[id]/route.ts
// Path: /src/app/api/services/[type]/[id]/route.ts
// Module: Service account CRUD
// Depends on: ../../../../../lib/auth/withAuth, ../../../../../services/\_registry/ServiceRegistry
// Description: GET, PUT, DELETE single account

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/\_registry/ServiceRegistry'

export const GET = withAuth(async (req, { params, user }) => {
// TODO: implement
// 1. service.load(user.uid, params.id)
// 2. Return config (NOT credentials raw — mask credential fields)
return Response.json({ data: null }, { status: 501 })
})

export const PUT = withAuth(async (req, { params, user }) => {
// TODO: implement — partial update
return Response.json({ data: null }, { status: 501 })
})

export const DELETE = withAuth(async (req, { params, user }) => {
// TODO: implement
// service.delete(user.uid, params.id)
// Return 204
return new Response(null, { status: 204 })
})
// /src/app/api/services/[type]/[id]/fetch/route.ts
// Path: /src/app/api/services/[type]/[id]/fetch/route.ts
// Module: Trigger metadata re-fetch
// Depends on: withAuth, ServiceRegistry, OperationLogger
// Description: POST triggers fetchMetadata() and updates RTDB

import { withAuth } from '@/lib/auth/withAuth'
import { ServiceRegistry } from '@/services/\_registry/ServiceRegistry'
import { OperationLogger } from '@/lib/logger/OperationLogger'

export const POST = withAuth(async (req, { params, user }) => {
// TODO: implement
// 1. service.load(user.uid, params.id) → { credentials }
// 2. const opCtx = OperationLogger.getInstance().startOperation('FETCH_METADATA', { serviceType: params.type, accountId: params.id })
// 3. const meta = await service.fetchMetadata(credentials) [with retry 3x, exponential backoff]
// 4. ShardManager update config fields
// 5. opCtx.end('SUCCESS', { durationMs })
// 6. Return { updated_fields: Object.keys(meta), duration_ms }
return Response.json({ data: null }, { status: 501 })
})
Import Map
[type]/route.ts → @/lib/auth/withAuth, @/services/\_registry/ServiceRegistry, zod
[type]/[id]/route.ts → @/lib/auth/withAuth, @/services/\_registry/ServiceRegistry
[type]/[id]/fetch/route.ts → @/lib/auth/withAuth, @/services/\_registry/ServiceRegistry, @/lib/logger/OperationLogger
[type]/[id]/sub/[subType]/route.ts → @/lib/auth/withAuth, @/services/\_registry/ServiceRegistry, zod
export/route.ts → @/lib/auth/withAuth, @/lib/export/ExportBuilder
import/route.ts → @/lib/auth/withAuth, @/lib/export/ImportValidator
Test Cases
// /tests/integration/ServiceRoutes.test.ts

describe('Service API Routes', () => {
// TC-302-01: GET list returns 200 with empty array
test('GET /api/services/github returns 200', async () => {
const res = await fetch('http://localhost:3000/api/services/github', {
headers: { Authorization: 'Bearer valid-token' }
})
expect(res.status).toBe(200)
const body = await res.json()
expect(Array.isArray(body.data)).toBe(true)
})

// TC-302-02: POST with invalid body returns 400
test('POST /api/services/github with invalid body returns 400', async () => {
const res = await fetch('http://localhost:3000/api/services/github', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
body: JSON.stringify({ invalid: 'data' })
})
expect(res.status).toBe(400)
const body = await res.json()
expect(body.error).toBeDefined()
})

// TC-302-03: POST with valid body returns 201
test('POST /api/services/github with valid body returns 201', async () => {
const res = await fetch('http://localhost:3000/api/services/github', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
body: JSON.stringify({
name: 'my-github',
config: {},
credentials: { token: 'ghp_validtoken' }
})
})
expect(res.status).toBe(201)
const body = await res.json()
expect(body.data.id).toBeDefined()
})

// TC-302-04: Unauthenticated requests return 401
test('GET /api/services/github without auth returns 401', async () => {
const res = await fetch('http://localhost:3000/api/services/github')
expect(res.status).toBe(401)
})

// TC-302-05: Unknown service type returns 404
test('GET /api/services/unknown-service returns 404', async () => {
const res = await fetch('http://localhost:3000/api/services/unknown-service', {
headers: { Authorization: 'Bearer valid-token' }
})
expect(res.status).toBe(404)
})

// TC-302-06: DELETE returns 204
test('DELETE /api/services/github/:id returns 204', async () => {
// Create first, then delete
const createRes = await fetch('http://localhost:3000/api/services/github', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
body: JSON.stringify({ name: 'to-delete', config: {}, credentials: { token: 'ghp_valid' } })
})
const { data } = await createRes.json()
const deleteRes = await fetch(`http://localhost:3000/api/services/github/${data.id}`, {
method: 'DELETE',
headers: { Authorization: 'Bearer valid-token' }
})
expect(deleteRes.status).toBe(204)
})
})
═══════════════════════════════════════════════
🟢 NHÓM 4 — SERVICES MVP
═══════════════════════════════════════════════
T-401 · GitHub Service
Status: TODO
Wave: 7
Phụ thuộc: T-301
Agent: unassigned
Type Definitions
// /src/services/github/types.ts
// Path: /src/services/github/types.ts

export interface GithubCredential {
token: string // PAT or OAuth token — ENCRYPT
webhook_secret?: string // ENCRYPT
}

export interface GithubConfig {
owner: string // GitHub username/org
plan: 'free' | 'pro' | 'team' | 'enterprise'
avatar_url: string
public_repos: number
private_repos: number
html_url: string
followers: number
following: number
}

export interface GithubRepo {
id: number
name: string
full_name: string
private: boolean
default_branch: string
language: string | null
stargazers_count: number
updated_at: string
html_url: string
clone_url: string
}

export interface GithubWorkflow {
id: number
name: string
path: string
state: 'active' | 'disabled_manually' | 'disabled_fork'
html_url: string
}

export interface GithubHook {
id: number
url: string
config: {
url: string
content_type: string
insecure_ssl: string
}
events: string[]
active: boolean
created_at: string
}

export interface GithubUser {
id: number
login: string
avatar_url: string
html_url: string
plan?: { name: string }
public_repos: number
total_private_repos: number
followers: number
following: number
}

export interface CreateHookInput {
url: string
events: string[]
secret?: string
contentType?: 'json' | 'form'
}
Function Signatures
// /src/services/github/GithubApi.ts

export class GithubApi {
private baseUrl = 'https://api.github.com'

constructor(private token: string) {}

getUser(): Promise<GithubUser>

listRepos(page?: number, perPage?: number): Promise<GithubRepo[]>
// GET /user/repos?per_page={perPage}&page={page}
// perPage default 100, max 100

listAllRepos(): Promise<GithubRepo[]>
// Paginate until empty page

listWorkflows(owner: string, repo: string): Promise<GithubWorkflow[]>
// GET /repos/{owner}/{repo}/actions/workflows

triggerWorkflow(owner: string, repo: string, workflowId: number, ref?: string): Promise<void>
// POST /repos/{owner}/{repo}/actions/workflows/{workflowId}/dispatches

listHooks(owner: string, repo: string): Promise<GithubHook[]>
// GET /repos/{owner}/{repo}/hooks

createHook(owner: string, repo: string, input: CreateHookInput): Promise<GithubHook>
// POST /repos/{owner}/{repo}/hooks

deleteHook(owner: string, repo: string, hookId: number): Promise<void>
// DELETE /repos/{owner}/{repo}/hooks/{hookId}

private request<T>(path: string, options?: RequestInit): Promise<T>
// Adds Authorization header, handles rate limiting, retries 3x with backoff
// Throws with correct error codes
}
// /src/services/github/GithubService.ts

export class GithubService extends BaseService<GithubConfig, GithubCredential, GithubRepo | GithubWorkflow | GithubHook> {
readonly SERVICE_TYPE = 'github'
readonly SERVICE_LABEL = 'GitHub'
readonly CREDENTIAL_FIELDS = ['token', 'webhook_secret']
readonly ICON = 'github'
readonly DESCRIPTION = 'Manage GitHub repositories, workflows, and webhooks'

validateCredentials(creds: GithubCredential): Promise<boolean>
fetchMetadata(creds: GithubCredential): Promise<Partial<GithubConfig>>
getSubResourceTypes(): SubResourceDef[]
fetchSubResources(type: string, accountId: string, uid: string): Promise<any[]>
createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>): Promise<any>
deleteSubResource(type: string, accountId: string, uid: string, id: string): Promise<void>
}
Code Skeleton
// /src/services/github/GithubApi.ts
// Path: /src/services/github/GithubApi.ts
// Module: GithubApi
// Depends on: axios, ../../lib/logger/OperationLogger
// Description: GitHub REST API adapter with retry and error mapping

import axios, { AxiosError } from 'axios'
import type { GithubUser, GithubRepo, GithubWorkflow, GithubHook, CreateHookInput } from './types'

const GITHUB_ERROR_MAP: Record<number, string> = {
401: 'GH-AUTH-001',
403: 'GH-API-001',
404: 'GH-API-002',
422: 'GH-HOOK-001',
}

export class GithubApi {
private readonly baseUrl = 'https://api.github.com'
private readonly timeout = 30_000

constructor(private readonly token: string) {}

async getUser(): Promise<GithubUser> {
// TODO: implement → this.request<GithubUser>('/user')
throw new Error('Not implemented')
}

async listRepos(page = 1, perPage = 100): Promise<GithubRepo[]> {
// TODO: implement
// GET /user/repos?per_page={perPage}&page={page}&sort=updated
throw new Error('Not implemented')
}

async listAllRepos(): Promise<GithubRepo[]> {
// TODO: implement
// Loop page=1,2,3... until response.length < perPage
throw new Error('Not implemented')
}

async listWorkflows(owner: string, repo: string): Promise<GithubWorkflow[]> {
// TODO: implement → GET /repos/{owner}/{repo}/actions/workflows
// Return data.workflows
throw new Error('Not implemented')
}

async triggerWorkflow(owner: string, repo: string, workflowId: number, ref = 'main'): Promise<void> {
// TODO: implement → POST /repos/{owner}/{repo}/actions/workflows/{workflowId}/dispatches
// Body: { ref }
throw new Error('Not implemented')
}

async listHooks(owner: string, repo: string): Promise<GithubHook[]> {
// TODO: implement → GET /repos/{owner}/{repo}/hooks
throw new Error('Not implemented')
}

async createHook(owner: string, repo: string, input: CreateHookInput): Promise<GithubHook> {
// TODO: implement
// POST /repos/{owner}/{repo}/hooks
// Body: { name: 'web', active: true, events: input.events,
// config: { url: input.url, content_type: input.contentType ?? 'json', secret: input.secret } }
throw new Error('Not implemented')
}

async deleteHook(owner: string, repo: string, hookId: number): Promise<void> {
// TODO: implement → DELETE /repos/{owner}/{repo}/hooks/{hookId}
throw new Error('Not implemented')
}

private async request<T>(path: string, options: {
method?: string
body?: unknown
retries?: number
} = {}): Promise<T> {
// TODO: implement
// 1. axios({ url: baseUrl + path, method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }, data: body, timeout })
// 2. On error: map status to error code from GITHUB_ERROR_MAP
// 3. Retry on 429 (check Retry-After header) or 5xx, max 3 retries, exponential backoff
// 4. Throw with { code: 'GH-XXX-XXX', message, statusCode }
throw new Error('Not implemented')
}
}
// /src/services/github/GithubService.ts
// Path: /src/services/github/GithubService.ts
// Module: GithubService
// Depends on: ../\_base/BaseService, ./GithubApi, ./types
// Description: GitHub service implementation

import { BaseService } from '../\_base/BaseService'
import { GithubApi } from './GithubApi'
import type { GithubConfig, GithubCredential, GithubRepo, GithubWorkflow, GithubHook } from './types'
import type { SubResourceDef } from '../\_base/BaseSchema'

export class GithubService extends BaseService<
GithubConfig,
GithubCredential,
GithubRepo | GithubWorkflow | GithubHook

> {
> readonly SERVICE_TYPE = 'github' as const
> readonly SERVICE_LABEL = 'GitHub'
> readonly CREDENTIAL_FIELDS = ['token', 'webhook_secret']
> readonly ICON = 'github'
> readonly DESCRIPTION = 'Manage GitHub repositories, workflows, and webhooks'

async validateCredentials(creds: GithubCredential): Promise<boolean> {
// TODO: implement
// try { const api = new GithubApi(creds.token); await api.getUser(); return true }
// catch { return false }
throw new Error('Not implemented')
}

async fetchMetadata(creds: GithubCredential): Promise<Partial<GithubConfig>> {
// TODO: implement
// const user = await new GithubApi(creds.token).getUser()
// return { owner: user.login, avatar_url: user.avatar_url, html_url: user.html_url,
// plan: user.plan?.name as any ?? 'free', public_repos: user.public_repos,
// private_repos: user.total_private_repos ?? 0, followers: user.followers, following: user.following }
throw new Error('Not implemented')
}

getSubResourceTypes(): SubResourceDef[] {
return [
{ type: 'repos', label: 'Repositories', icon: 'folder-git-2', canCreate: false, canDelete: true },
{ type: 'workflows', label: 'Workflows', icon: 'play-circle', canCreate: false, canDelete: false, requiresInput: ['repo_name'] },
{ type: 'webhooks', label: 'Webhooks', icon: 'webhook', canCreate: true, canDelete: true, requiresInput: ['repo_name'] },
]
}

async fetchSubResources(type: string, accountId: string, uid: string): Promise<any[]> {
// TODO: implement
// 1. load credentials: const { credentials, config } = await this.load(uid, accountId)
// 2. const api = new GithubApi(credentials.token)
// 3. Switch type:
// 'repos' → api.listAllRepos()
// 'workflows' → api.listWorkflows(config.owner, params.repo_name)
// 'webhooks' → api.listHooks(config.owner, params.repo_name)
throw new Error('Not implemented')
}

async createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>): Promise<any> {
// TODO: implement
// Only 'webhooks' supports create
// Validate required fields: url, events[] — if missing return { missing_fields: [...], defaults: { content_type: 'json' } }
throw new Error('Not implemented')
}

async deleteSubResource(type: string, accountId: string, uid: string, id: string): Promise<void> {
// TODO: implement
throw new Error('Not implemented')
}
}

// Register
import { ServiceRegistry } from '../\_registry/ServiceRegistry'
ServiceRegistry.register(new GithubService())
Import Map
GithubApi.ts → axios
GithubService.ts → ../\_base/BaseService, ./GithubApi, ./types, ../\_registry/ServiceRegistry
GithubSchema.ts → zod
types.ts → (no imports — type definitions only)
index.ts → export { GithubService } from './GithubService'
import './GithubService' ← triggers ServiceRegistry.register()
components/GithubAccountCard.tsx → react, lucide-react, ../../services/github/types
Test Cases
// /tests/unit/GithubService.test.ts

jest.mock('axios')

describe('GithubService', () => {
const service = new GithubService()

// TC-401-01: Implements BaseService
test('GithubService is instance of BaseService', () => {
expect(service).toBeInstanceOf(BaseService)
})

// TC-401-02: SERVICE_TYPE is 'github'
test('SERVICE_TYPE is github', () => {
expect(service.SERVICE_TYPE).toBe('github')
})

// TC-401-03: validateCredentials returns true for valid token
test('validateCredentials returns true when API returns user', async () => {
(axios as any).mockResolvedValueOnce({ data: { login: 'testuser', public_repos: 5 } })
const result = await service.validateCredentials({ token: 'ghp_valid' })
expect(result).toBe(true)
})

// TC-401-04: validateCredentials returns false for invalid token
test('validateCredentials returns false when API throws 401', async () => {
(axios as any).mockRejectedValueOnce({ response: { status: 401 } })
const result = await service.validateCredentials({ token: 'ghp_invalid' })
expect(result).toBe(false)
})

// TC-401-05: fetchMetadata maps user fields correctly
test('fetchMetadata returns mapped config from GitHub user', async () => {
(axios as any).mockResolvedValueOnce({
data: {
login: 'octocat', avatar_url: 'https://...', html_url: 'https://github.com/octocat',
plan: { name: 'pro' }, public_repos: 10, total_private_repos: 5, followers: 100, following: 50
}
})
const meta = await service.fetchMetadata({ token: 'ghp_valid' })
expect(meta.owner).toBe('octocat')
expect(meta.plan).toBe('pro')
expect(meta.public_repos).toBe(10)
})

// TC-401-06: listRepos paginates correctly
test('GithubApi.listAllRepos fetches multiple pages', async () => {
// Page 1: 100 items, Page 2: 50 items (< 100 → stop)
const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `repo-${i}` }))
const page2 = Array.from({ length: 50 }, (_, i) => ({ id: 100 + i, name: `repo-${100+i}` }))
;(axios as any)
.mockResolvedValueOnce({ data: page1 })
.mockResolvedValueOnce({ data: page2 })
const api = new GithubApi('ghp_valid')
const repos = await api.listAllRepos()
expect(repos).toHaveLength(150)
})

// TC-401-07: GH-API-001 on rate limit
test('GithubApi throws GH-API-001 on 403 response', async () => {
(axios as any).mockRejectedValueOnce({ response: { status: 403 } })
const api = new GithubApi('ghp_valid')
await expect(api.getUser()).rejects.toMatchObject({ code: 'GH-API-001' })
})

// TC-401-08: Registered in ServiceRegistry
test('GithubService is registered in ServiceRegistry', () => {
expect(ServiceRegistry.has('github')).toBe(true)
})
})
T-402 · Cloudflare Service
Status: TODO
Wave: 7
Phụ thuộc: T-301
Agent: unassigned
Type Definitions
// /src/services/cloudflare/types.ts

export interface CloudflareCredential {
api_key: string // ENCRYPT — Global API Key
api_token?: string // ENCRYPT — Scoped token (preferred)
email: string // Account email (not encrypted — needed for headers)
}

export interface CloudflareConfig {
account_id: string
account_name: string
plan: string
}

export interface CFZone {
id: string
name: string
status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted'
plan: { name: string }
name_servers: string[]
modified_on: string
}

export interface CFTunnel {
id: string
name: string
status: 'healthy' | 'degraded' | 'down' | 'inactive'
created_at: string
connections: Array<{
colo_name: string
is_pending_reconnect: boolean
opened_at: string
}>
}

export interface CFDnsRecord {
id: string
type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV'
name: string
content: string
ttl: number
proxied: boolean
modified_on: string
}

export interface CreateTunnelInput {
name: string
}

export interface CreateDnsRecordInput {
type: CFDnsRecord['type']
name: string
content: string
ttl?: number
proxied?: boolean
}
Function Signatures
// /src/services/cloudflare/CloudflareApi.ts

export class CloudflareApi {
private baseUrl = 'https://api.cloudflare.com/client/v4'

constructor(private credential: { api_key?: string; api_token?: string; email?: string }) {}

getAccount(): Promise<{ id: string; name: string }>
listZones(page?: number): Promise<{ result: CFZone[]; result_info: { total_pages: number } }>
listTunnels(accountId: string): Promise<CFTunnel[]>
createTunnel(accountId: string, name: string): Promise<CFTunnel>
deleteTunnel(accountId: string, tunnelId: string): Promise<void>
getTunnelToken(accountId: string, tunnelId: string): Promise<string>
listDnsRecords(zoneId: string): Promise<CFDnsRecord[]>
createDnsRecord(zoneId: string, record: CreateDnsRecordInput): Promise<CFDnsRecord>
deleteDnsRecord(zoneId: string, recordId: string): Promise<void>
private headers(): Record<string, string>
private request<T>(path: string, options?: object): Promise<T>
}
Code Skeleton
// /src/services/cloudflare/CloudflareApi.ts
// Path: /src/services/cloudflare/CloudflareApi.ts
// Module: CloudflareApi
// Depends on: axios
// Description: Cloudflare REST API adapter

import axios from 'axios'
import type { CFZone, CFTunnel, CFDnsRecord, CreateTunnelInput, CreateDnsRecordInput } from './types'

const CF_ERROR_MAP: Record<number, string> = {
400: 'CF-API-000',
401: 'CF-AUTH-001',
403: 'CF-AUTH-001',
404: 'CF-API-002',
429: 'CF-API-001',
}

export class CloudflareApi {
private readonly baseUrl = 'https://api.cloudflare.com/client/v4'

constructor(private readonly cred: {
api_key?: string
api_token?: string
email?: string
}) {}

private headers(): Record<string, string> {
// TODO: implement
// If api_token: { Authorization: `Bearer ${api_token}`, 'Content-Type': 'application/json' }
// Else: { 'X-Auth-Email': email, 'X-Auth-Key': api_key, 'Content-Type': 'application/json' }
return {}
}

async getAccount(): Promise<{ id: string; name: string }> {
// TODO: implement → GET /accounts?page=1&per_page=1 → first account
throw new Error('Not implemented')
}

async listZones(page = 1): Promise<{ result: CFZone[]; result_info: { total_pages: number } }> {
// TODO: implement → GET /zones?page={page}&per_page=50
throw new Error('Not implemented')
}

async listTunnels(accountId: string): Promise<CFTunnel[]> {
// TODO: implement → GET /accounts/{accountId}/cfd_tunnel
throw new Error('Not implemented')
}

async createTunnel(accountId: string, name: string): Promise<CFTunnel> {
// TODO: implement → POST /accounts/{accountId}/cfd_tunnel
// Body: { name, tunnel_secret: randomBytes(32).toString('base64') }
throw new Error('Not implemented')
}

async deleteTunnel(accountId: string, tunnelId: string): Promise<void> {
// TODO: implement → DELETE /accounts/{accountId}/cfd_tunnel/{tunnelId}
throw new Error('Not implemented')
}

async getTunnelToken(accountId: string, tunnelId: string): Promise<string> {
// TODO: implement → GET /accounts/{accountId}/cfd_tunnel/{tunnelId}/token
// Response: { result: "token-string" }
throw new Error('Not implemented')
}

async listDnsRecords(zoneId: string): Promise<CFDnsRecord[]> {
// TODO: implement → GET /zones/{zoneId}/dns_records
throw new Error('Not implemented')
}

async createDnsRecord(zoneId: string, record: CreateDnsRecordInput): Promise<CFDnsRecord> {
// TODO: implement → POST /zones/{zoneId}/dns_records
throw new Error('Not implemented')
}

async deleteDnsRecord(zoneId: string, recordId: string): Promise<void> {
// TODO: implement → DELETE /zones/{zoneId}/dns_records/{recordId}
throw new Error('Not implemented')
}

private async request<T>(path: string, options: {
method?: string
body?: unknown
retries?: number
} = {}): Promise<{ result: T }> {
// TODO: implement with retry + error mapping
throw new Error('Not implemented')
}
}
Import Map
CloudflareApi.ts → axios, crypto (for tunnel secret), ./types
CloudflareService.ts → ../\_base/BaseService, ./CloudflareApi, ./types, ../\_registry/ServiceRegistry
CloudflareSchema.ts → zod
index.ts → export { CloudflareService }, import './CloudflareService'
Test Cases
// /tests/unit/CloudflareService.test.ts

jest.mock('axios')

describe('CloudflareService', () => {
const service = new CloudflareService()

// TC-402-01: Implements BaseService
test('is instance of BaseService', () => {
expect(service).toBeInstanceOf(BaseService)
})

// TC-402-02: Uses api_token header when provided
test('uses Bearer token header when api_token is set', () => {
const api = new CloudflareApi({ api_token: 'my-token' })
const headers = (api as any).headers()
expect(headers['Authorization']).toBe('Bearer my-token')
expect(headers['X-Auth-Key']).toBeUndefined()
})

// TC-402-03: Uses X-Auth headers for global API key
test('uses X-Auth-Key header when api_key + email set', () => {
const api = new CloudflareApi({ api_key: 'key123', email: 'user@example.com' })
const headers = (api as any).headers()
expect(headers['X-Auth-Key']).toBe('key123')
expect(headers['X-Auth-Email']).toBe('user@example.com')
})

// TC-402-04: createTunnel returns tunnel
test('createTunnel returns tunnel object with id', async () => {
(axios as any).mockResolvedValueOnce({ data: { result: { id: 'tunnel-123', name: 'my-tunnel', status: 'healthy', created_at: '' } } })
const api = new CloudflareApi({ api_token: 'token' })
const tunnel = await api.createTunnel('acc-123', 'my-tunnel')
expect(tunnel.id).toBe('tunnel-123')
})

// TC-402-05: getTunnelToken returns string
test('getTunnelToken returns token string', async () => {
(axios as any).mockResolvedValueOnce({ data: { result: 'eyJhbGci...' } })
const api = new CloudflareApi({ api_token: 'token' })
const token = await api.getTunnelToken('acc-123', 'tunnel-123')
expect(typeof token).toBe('string')
expect(token.length).toBeGreaterThan(0)
})

// TC-402-06: CF-AUTH-001 on 401
test('throws CF-AUTH-001 on 401', async () => {
(axios as any).mockRejectedValueOnce({ response: { status: 401 } })
const api = new CloudflareApi({ api_token: 'bad' })
await expect(api.getAccount()).rejects.toMatchObject({ code: 'CF-AUTH-001' })
})

// TC-402-07: Registered in ServiceRegistry
test('registered in ServiceRegistry', () => {
expect(ServiceRegistry.has('cloudflare')).toBe(true)
})
})
T-403 · Supabase Service
Status: TODO
Wave: 7
Phụ thuộc: T-301
Agent: unassigned
Type Definitions
// /src/services/supabase/types.ts

export interface SupabaseCredential {
service_role_key: string // ENCRYPT
anon_key: string // ENCRYPT
access_token?: string // ENCRYPT — Management API token
}

export interface SupabaseConfig {
project_url: string // https://xxx.supabase.co
project_id: string // 'xxx' portion
project_name: string
region: string
db_host: string
}

export interface SupabaseProject {
id: string
name: string
region: string
created_at: string
status: 'ACTIVE_HEALTHY' | 'INACTIVE' | 'COMING_UP' | 'UNKNOWN'
}

export interface SupabaseTable {
name: string
schema: string
columns: Array<{
name: string
type: string
nullable: boolean
default?: string
}>
}

export interface SupabaseEdgeFunction {
id: string
slug: string
name: string
status: 'ACTIVE' | 'REMOVED' | 'THROTTLED'
created_at: string
version: number
}
Function Signatures
// /src/services/supabase/SupabaseApi.ts

export class SupabaseApi {
constructor(private credential: SupabaseCredential, private config: Partial<SupabaseConfig>) {}

// Validate: hit REST endpoint
ping(): Promise<boolean>

// Management API (requires access_token)
listProjects(): Promise<SupabaseProject[]>
getProjectDetails(ref: string): Promise<SupabaseProject>

// Schema inspection
listTables(projectUrl: string, serviceRoleKey: string): Promise<SupabaseTable[]>

// Edge functions (requires access_token)
listEdgeFunctions(projectRef: string): Promise<SupabaseEdgeFunction[]>

private managementRequest<T>(path: string, method?: string): Promise<T>
// Base URL: https://api.supabase.com/v1
// Header: Authorization: Bearer {access_token}

private restRequest<T>(path: string, serviceRoleKey: string): Promise<T>
// Base URL: {project_url}/rest/v1
// Header: apikey: {serviceRoleKey}, Authorization: Bearer {serviceRoleKey}
}
Code Skeleton
// /src/services/supabase/SupabaseApi.ts
// Path: /src/services/supabase/SupabaseApi.ts
// Module: SupabaseApi
// Depends on: axios
// Description: Supabase REST + Management API adapter

import axios from 'axios'
import type { SupabaseCredential, SupabaseConfig, SupabaseProject, SupabaseTable, SupabaseEdgeFunction } from './types'

export class SupabaseApi {
constructor(
private readonly credential: SupabaseCredential,
private readonly config: Partial<SupabaseConfig>
) {}

async ping(): Promise<boolean> {
// TODO: implement
// GET {project_url}/rest/v1/ with service_role_key header
// Returns true if 200, false otherwise
throw new Error('Not implemented')
}

async listProjects(): Promise<SupabaseProject[]> {
// TODO: implement
// Requires access_token — throw SB-MGMT-001 if missing
// GET https://api.supabase.com/v1/projects
throw new Error('Not implemented')
}

async listTables(projectUrl: string, serviceRoleKey: string): Promise<SupabaseTable[]> {
// TODO: implement
// GET {projectUrl}/rest/v1/ → parse OpenAPI spec for table names
// Or: query pg_catalog via REST
throw new Error('Not implemented')
}

async listEdgeFunctions(projectRef: string): Promise<SupabaseEdgeFunction[]> {
// TODO: implement
// Requires access_token
// GET https://api.supabase.com/v1/projects/{projectRef}/functions
throw new Error('Not implemented')
}

private async managementRequest<T>(path: string, method = 'GET'): Promise<T> {
// TODO: implement
// if (!this.credential.access_token) throw { code: 'SB-MGMT-001', message: 'Management token required' }
throw new Error('Not implemented')
}
}
Import Map
SupabaseApi.ts → axios, ./types
SupabaseService.ts → ../\_base/BaseService, ./SupabaseApi, ./types, ../\_registry/ServiceRegistry
SupabaseSchema.ts → zod
index.ts → export { SupabaseService }, import './SupabaseService'
Test Cases
// /tests/unit/SupabaseService.test.ts

jest.mock('axios')

describe('SupabaseService', () => {
const service = new SupabaseService()

// TC-403-01: Implements BaseService
test('is instance of BaseService', () => {
expect(service).toBeInstanceOf(BaseService)
})

// TC-403-02: validateCredentials calls ping()
test('validateCredentials returns true when ping succeeds', async () => {
(axios as any).mockResolvedValueOnce({ status: 200, data: {} })
const result = await service.validateCredentials({
service_role_key: 'eyJ...', anon_key: 'eyJ...'
} as any)
expect(result).toBe(true)
})

// TC-403-03: SB-MGMT-001 when no access_token for listProjects
test('listProjects throws SB-MGMT-001 without access_token', async () => {
const api = new SupabaseApi(
{ service_role_key: 'k', anon_key: 'k' },
{ project_url: 'https://abc.supabase.co' }
)
await expect(api.listProjects()).rejects.toMatchObject({ code: 'SB-MGMT-001' })
})

// TC-403-04: Registered in ServiceRegistry
test('registered in ServiceRegistry', () => {
expect(ServiceRegistry.has('supabase')).toBe(true)
})
})
T-404 · Resend Service
Status: TODO
Wave: 7
Phụ thuộc: T-301
Agent: unassigned
Type Definitions
// /src/services/resend/types.ts

export interface ResendCredential {
api*key: string // ENCRYPT — re*...
}

export interface ResendConfig {
from_email: string
account_id: string
account_name: string
}

export interface ResendDomain {
id: string
name: string
status: 'verified' | 'pending' | 'failed'
region: 'us-east-1' | 'eu-west-1' | 'sa-east-1'
created_at: string
dns_records: Array<{
record: string
name: string
type: string
ttl: string
status: 'verified' | 'pending'
value: string
}>
}

export interface ResendApiKey {
id: string
name: string
created_at: string
permission: 'full_access' | 'sending_access'
}

export interface CreateApiKeyInput {
name: string
permission: 'full_access' | 'sending_access'
domain_id?: string
}
Function Signatures
// /src/services/resend/ResendApi.ts

export class ResendApi {
private baseUrl = 'https://api.resend.com'

constructor(private apiKey: string) {}

listDomains(): Promise<ResendDomain[]>
verifyDomain(domainId: string): Promise<void>
deleteDomain(domainId: string): Promise<void>

listApiKeys(): Promise<ResendApiKey[]>
createApiKey(input: CreateApiKeyInput): Promise<{ id: string; token: string }>
deleteApiKey(apiKeyId: string): Promise<void>

// For validate: just check if domains endpoint returns
getMe(): Promise<{ id: string; email: string; display_name: string }>

private request<T>(path: string, options?: object): Promise<T>
}
Code Skeleton
// /src/services/resend/ResendApi.ts
// Path: /src/services/resend/ResendApi.ts
// Module: ResendApi
// Depends on: axios
// Description: Resend email platform API adapter

import axios from 'axios'
import type { ResendDomain, ResendApiKey, CreateApiKeyInput } from './types'

export class ResendApi {
private readonly baseUrl = 'https://api.resend.com'

constructor(private readonly apiKey: string) {}

async listDomains(): Promise<ResendDomain[]> {
// TODO: implement → GET /domains → data.data
throw new Error('Not implemented')
}

async verifyDomain(domainId: string): Promise<void> {
// TODO: implement → POST /domains/{domainId}/verify
throw new Error('Not implemented')
}

async deleteDomain(domainId: string): Promise<void> {
// TODO: implement → DELETE /domains/{domainId}
throw new Error('Not implemented')
}

async listApiKeys(): Promise<ResendApiKey[]> {
// TODO: implement → GET /api-keys → data.data
throw new Error('Not implemented')
}

async createApiKey(input: CreateApiKeyInput): Promise<{ id: string; token: string }> {
// TODO: implement → POST /api-keys
throw new Error('Not implemented')
}

async deleteApiKey(apiKeyId: string): Promise<void> {
// TODO: implement → DELETE /api-keys/{apiKeyId}
throw new Error('Not implemented')
}

async getMe(): Promise<{ id: string; email: string; display_name: string }> {
// TODO: implement → GET /me (or use domains as health check)
throw new Error('Not implemented')
}

private async request<T>(path: string, options: {
method?: string
body?: unknown
} = {}): Promise<T> {
// TODO: implement
// Authorization: `Bearer ${apiKey}`
// Map 401 → RS-AUTH-001
throw new Error('Not implemented')
}
}
// /src/services/resend/ResendService.ts
// Path: /src/services/resend/ResendService.ts
// Module: ResendService
// Depends on: ../\_base/BaseService, ./ResendApi, ./types, ../\_registry/ServiceRegistry

import { BaseService } from '../\_base/BaseService'
import { ResendApi } from './ResendApi'
import { ServiceRegistry } from '../\_registry/ServiceRegistry'
import type { ResendConfig, ResendCredential, ResendDomain, ResendApiKey } from './types'
import type { SubResourceDef } from '../\_base/BaseSchema'

export class ResendService extends BaseService<
ResendConfig,
ResendCredential,
ResendDomain | ResendApiKey

> {
> readonly SERVICE_TYPE = 'resend' as const
> readonly SERVICE_LABEL = 'Resend'
> readonly CREDENTIAL_FIELDS = ['api_key']
> readonly ICON = 'mail'
> readonly DESCRIPTION = 'Manage Resend domains and API keys'

async validateCredentials(creds: ResendCredential): Promise<boolean> {
// TODO: implement
// try { await new ResendApi(creds.api_key).listDomains(); return true } catch { return false }
throw new Error('Not implemented')
}

async fetchMetadata(creds: ResendCredential): Promise<Partial<ResendConfig>> {
// TODO: implement
// const me = await new ResendApi(creds.api_key).getMe()
// return { account_id: me.id, account_name: me.display_name, from_email: me.email }
throw new Error('Not implemented')
}

getSubResourceTypes(): SubResourceDef[] {
return [
{ type: 'domains', label: 'Domains', icon: 'globe', canCreate: false, canDelete: true },
{ type: 'api_keys', label: 'API Keys', icon: 'key', canCreate: true, canDelete: true },
]
}

async fetchSubResources(type: string, accountId: string, uid: string): Promise<any[]> {
// TODO: implement
throw new Error('Not implemented')
}

async createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>): Promise<any> {
// TODO: implement — only api_keys supports create
// Required fields: name, permission
throw new Error('Not implemented')
}

async deleteSubResource(type: string, accountId: string, uid: string, id: string): Promise<void> {
// TODO: implement
throw new Error('Not implemented')
}
}

ServiceRegistry.register(new ResendService())
Test Cases
// /tests/unit/ResendService.test.ts

jest.mock('axios')

describe('ResendService', () => {
const service = new ResendService()

// TC-404-01: Implements BaseService
test('is instance of BaseService', () => {
expect(service).toBeInstanceOf(BaseService)
})

// TC-404-02: validateCredentials uses listDomains
test('validateCredentials returns true when listDomains succeeds', async () => {
(axios as any).mockResolvedValueOnce({ data: { data: [] } })
const result = await service.validateCredentials({ api_key: 're_valid123' })
expect(result).toBe(true)
})

// TC-404-03: RS-AUTH-001 on invalid key
test('throws RS-AUTH-001 for 401 response', async () => {
(axios as any).mockRejectedValueOnce({ response: { status: 401 } })
const api = new ResendApi('bad-key')
await expect(api.listDomains()).rejects.toMatchObject({ code: 'RS-AUTH-001' })
})

// TC-404-04: Registered
test('registered in ServiceRegistry', () => {
expect(ServiceRegistry.has('resend')).toBe(true)
})
})
T-405 · Google Credentials Service
Status: TODO
Wave: 7
Phụ thuộc: T-301
Agent: unassigned
Type Definitions
// /src/services/google-creds/types.ts

export type GoogleCredType = 'oauth_app' | 'service_account' | 'api_key'

export interface GoogleOAuthCredential {
credential_type: 'oauth_app'
client_id: string // NOT encrypted
client_secret: string // ENCRYPT
redirect_uris: string[]
app_type: 'web' | 'desktop' | 'mobile'
}

export interface GoogleServiceAccountCredential {
credential_type: 'service_account'
json_key: string // ENCRYPT — full JSON string
project_id: string // NOT encrypted
client_email: string // NOT encrypted
}

export interface GoogleApiKeyCredential {
credential_type: 'api_key'
key: string // ENCRYPT
restrictions: string[]
}

export type GoogleCredential =
| GoogleOAuthCredential
| GoogleServiceAccountCredential
| GoogleApiKeyCredential

export interface GoogleCredsConfig {
credential_type: GoogleCredType
display_name: string
project_id?: string
client_email?: string // for service accounts
}

export interface GCPProject {
projectId: string
name: string
projectNumber: string
lifecycleState: 'ACTIVE' | 'DELETE_REQUESTED' | 'DELETE_IN_PROGRESS'
}
Function Signatures
// /src/services/google-creds/GoogleCredsApi.ts

export class GoogleCredsApi {
listProjects(serviceAccountJson: string): Promise<GCPProject[]>
// Uses Resource Manager API v1
// GET https://cloudresourcemanager.googleapis.com/v1/projects
// Authenticates via service account JWT

validateOAuthApp(clientId: string, clientSecret: string): Promise<boolean>
// Try to get token info — basic validation

validateApiKey(key: string): Promise<boolean>
// Try a simple API call

private getServiceAccountToken(jsonKey: string): Promise<string>
// Sign JWT, exchange for access token
}
Code Skeleton
// /src/services/google-creds/GoogleCredsService.ts
// Path: /src/services/google-creds/GoogleCredsService.ts
// Module: GoogleCredsService
// Depends on: ../\_base/BaseService, ./GoogleCredsApi, ./types, ../\_registry/ServiceRegistry

import { BaseService } from '../\_base/BaseService'
import { GoogleCredsApi } from './GoogleCredsApi'
import { ServiceRegistry } from '../\_registry/ServiceRegistry'
import type { GoogleCredential, GoogleCredsConfig, GCPProject } from './types'
import type { SubResourceDef } from '../\_base/BaseSchema'

// Encrypted fields depend on credential_type — dynamic
const OAUTH_ENCRYPTED = ['client_secret']
const SA_ENCRYPTED = ['json_key']
const APIKEY_ENCRYPTED = ['key']

export class GoogleCredsService extends BaseService<
GoogleCredsConfig,
GoogleCredential,
GCPProject

> {
> readonly SERVICE_TYPE = 'google-creds' as const
> readonly SERVICE_LABEL = 'Google Credentials'
> readonly CREDENTIAL_FIELDS = ['client_secret', 'json_key', 'key'] // union — base handles only present fields
> readonly ICON = 'key-round'
> readonly DESCRIPTION = 'Manage Google OAuth apps, service accounts, and API keys'

async validateCredentials(creds: GoogleCredential): Promise<boolean> {
// TODO: implement
// Switch creds.credential_type:
// 'oauth_app': validateOAuthApp(client_id, client_secret)
// 'service_account': parse json_key → check required fields (type, project_id, private_key)
// 'api_key': validateApiKey(key)
throw new Error('Not implemented')
}

async fetchMetadata(creds: GoogleCredential): Promise<Partial<GoogleCredsConfig>> {
// TODO: implement
// 'oauth_app': return { credential_type: 'oauth_app', display_name: 'OAuth App - ' + creds.client_id }
// 'service_account': parse json_key → { credential_type, project_id: parsed.project_id, client_email: parsed.client_email, display_name: parsed.client_email }
// 'api_key': { credential_type: 'api_key', display_name: 'API Key' }
throw new Error('Not implemented')
}

getSubResourceTypes(): SubResourceDef[] {
return [
{ type: 'projects', label: 'GCP Projects', icon: 'folder', canCreate: false, canDelete: false, requiresInput: ['service_account_id'] },
]
}

async fetchSubResources(type: string, accountId: string, uid: string): Promise<any[]> {
// TODO: implement
// Load credentials → if service_account: api.listProjects(json_key)
// Else: return [] with warning
throw new Error('Not implemented')
}

async createSubResource(): Promise<any> {
throw new Error('GC-API-001: Creating GCP projects not supported')
}

async deleteSubResource(): Promise<void> {
throw new Error('GC-API-001: Deleting GCP projects not supported')
}
}

ServiceRegistry.register(new GoogleCredsService())
Test Cases
// /tests/unit/GoogleCredsService.test.ts

describe('GoogleCredsService', () => {
const service = new GoogleCredsService()

// TC-405-01: Is BaseService
test('is instance of BaseService', () => {
expect(service).toBeInstanceOf(BaseService)
})

// TC-405-02: service_account JSON is encrypted
test('save encrypts json_key for service_account', async () => {
const spy = jest.spyOn(require('../../lib/crypto/FieldEncryptor'), 'encryptService')
const fakeJson = JSON.stringify({ type: 'service_account', project_id: 'proj', private_key: 'pk', client_email: 'sa@proj.iam.gserviceaccount.com' })
await service.save('uid1', {
name: 'my-sa',
config: { credential_type: 'service_account', display_name: 'SA', project_id: 'proj', client_email: 'sa@...' },
credentials: { credential_type: 'service_account', json_key: fakeJson, project_id: 'proj', client_email: 'sa@...' },
})
expect(spy).toHaveBeenCalledWith('google-creds', expect.objectContaining({ json_key: fakeJson }))
})

// TC-405-03: validateCredentials for invalid service account JSON
test('validateCredentials returns false for malformed service account JSON', async () => {
const result = await service.validateCredentials({
credential_type: 'service_account',
json_key: 'not-valid-json',
project_id: '',
client_email: '',
})
expect(result).toBe(false)
})

// TC-405-04: Registered
test('registered in ServiceRegistry', () => {
expect(ServiceRegistry.has('google-creds')).toBe(true)
})

// TC-405-05: fetchMetadata for service_account parses json_key
test('fetchMetadata extracts project_id from service account JSON', async () => {
const fakeJson = JSON.stringify({
type: 'service_account',
project_id: 'my-project',
private_key: 'pk',
client_email: 'sa@my-project.iam.gserviceaccount.com'
})
const meta = await service.fetchMetadata({
credential_type: 'service_account',
json_key: fakeJson,
project_id: 'my-project',
client_email: 'sa@my-project.iam.gserviceaccount.com',
})
expect(meta.project_id).toBe('my-project')
expect(meta.client_email).toBe('sa@my-project.iam.gserviceaccount.com')
})
})
═══════════════════════════════════════════════
🔷 NHÓM 5 — DASHBOARD & UI
═══════════════════════════════════════════════
T-501 · Layout & Shell Components
Status: TODO
Wave: 5 (parallel với T-301)
Phụ thuộc: T-201
Agent: unassigned
Type Definitions
// Props types for layout components

export interface AppShellProps {
children: React.ReactNode
}

export interface SidebarProps {
services: ServiceMeta[]
currentPath: string
isCollapsed?: boolean
onToggle?: () => void
}

export interface HeaderProps {
user: {
displayName?: string
email: string
avatarUrl?: string
}
breadcrumb?: Array<{ label: string; href?: string }>
}

export interface UserMenuProps {
user: HeaderProps['user']
onSignOut: () => void
}

export interface NotificationPanelProps {
isOpen: boolean
onClose: () => void
}

// Notification item from OperationLogger
export interface NotificationItem {
id: string
action: string
status: 'SUCCESS' | 'FAILURE'
message: string
timestamp: string
}
Code Skeleton
// /src/components/layout/AppShell.tsx
// Path: /src/components/layout/AppShell.tsx
// Module: AppShell
// Depends on: react, next/navigation, ./Sidebar, ./Header,
// ../../services/\_registry/ServiceRegistry, ../../lib/store/AppStore
// Description: Root layout shell — sidebar + header + content

'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/lib/store/AppStore'
import { ServiceRegistry } from '@/services/\_registry/ServiceRegistry'

export function AppShell({ children }: { children: React.ReactNode }) {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
const pathname = usePathname()
const { currentUser } = useAppStore()
const services = ServiceRegistry.list()

// TODO: implement
// - Responsive: on mobile, sidebar is hidden by default (sidebarCollapsed=true)
// - Grid layout: sidebar (240px | 60px collapsed) + main content
// - Sidebar collapses via toggle button in header

return (
<div className="flex h-screen bg-slate-950 text-slate-100">
<Sidebar
services={services}
currentPath={pathname}
isCollapsed={sidebarCollapsed}
onToggle={() => setSidebarCollapsed(p => !p)}
/>
<div className="flex flex-col flex-1 min-w-0">
<Header
user={{
            email: currentUser?.email ?? '',
            displayName: currentUser?.displayName,
          }}
breadcrumb={[]} // TODO: derive from pathname
/>
<main className="flex-1 overflow-auto p-6">
{children}
</main>
</div>
</div>
)
}
// /src/components/layout/Sidebar.tsx
// Path: /src/components/layout/Sidebar.tsx
// Module: Sidebar
// Depends on: react, next/link, next/navigation, lucide-react, ./index (types)
// Description: Navigation sidebar with service list from ServiceRegistry

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SidebarProps } from './index'

export function Sidebar({ services, isCollapsed, onToggle }: SidebarProps) {
// TODO: implement
// - Top: App logo (collapsed: icon only)
// - Middle: Service nav items — each links to /dashboard/services/{type}
// - Active state: bg-sky-500/10 text-sky-400 border-r-2 border-sky-500
// - Inactive: hover:bg-slate-800 text-slate-400
// - Bottom: Settings link
// - Use lucide-react icons matching ServiceMeta.icon
// - Collapsed mode: show only icons with tooltip on hover

return (
<aside className={`${isCollapsed ? 'w-16' : 'w-60'} transition-all duration-200 bg-slate-900 border-r border-slate-800 flex flex-col`}>
{/_ TODO: implement nav content _/}
</aside>
)
}
// /src/components/layout/Header.tsx
// Path: /src/components/layout/Header.tsx
// Module: Header
// Depends on: react, lucide-react, ./UserMenu, ./NotificationPanel, next-auth/react
// Description: Top header — breadcrumb + notification bell + user menu

'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { NotificationPanel } from './NotificationPanel'
import type { HeaderProps } from './index'

export function Header({ user, breadcrumb }: HeaderProps) {
const [notifOpen, setNotifOpen] = useState(false)

// TODO: implement
// - Left: Breadcrumb (/ separated path links)
// - Right: Bell icon (with badge count), UserMenu avatar

return (
<header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
{/_ TODO: breadcrumb + actions _/}
<NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
</header>
)
}
Import Map
AppShell.tsx → react, next/navigation, ./Sidebar, ./Header,
@/services/\_registry/ServiceRegistry, @/lib/store/AppStore
Sidebar.tsx → react, next/link, next/navigation, lucide-react
Header.tsx → react, lucide-react, ./UserMenu, ./NotificationPanel, next-auth/react
UserMenu.tsx → react, next-auth/react, lucide-react, next/link
NotificationPanel.tsx → react, @/lib/logger/OperationLogger, date-fns
dashboard/layout.tsx → @/components/layout/AppShell, next-auth (auth check)
Test Cases
// TC-501-01: AppShell renders without crashing
// TC-501-02: Sidebar shows all registered services
// TC-501-03: Active service is highlighted in sidebar
// TC-501-04: Sidebar collapses to icon-only on mobile (<640px)
// TC-501-05: Dark mode: all backgrounds use slate-900/950, text slate-100
// TC-501-06: Header breadcrumb matches current path segments
// TC-501-07: UserMenu triggers signOut on click
// TC-501-08: NotificationPanel shows latest OperationLogs
T-502 · Service Dashboard Page (Generic)
Status: TODO
Wave: 8
Phụ thuộc: T-301, T-501
Agent: unassigned
Type Definitions
// Props for shared service components

export interface AccountListProps {
serviceType: string
uid: string
}

export interface AccountCardProps {
item: ServiceListItem
isSelected: boolean
onSelect: (id: string) => void
onDelete: (id: string) => void
}

export interface AddAccountModalProps {
serviceType: string
isOpen: boolean
onClose: () => void
onSuccess: (id: string) => void
}

export interface SubResourcePanelProps {
serviceType: string
accountId: string
uid: string
subResourceType: SubResourceDef
}

export interface DynamicFormField {
name: string
label: string
type: 'text' | 'password' | 'select' | 'textarea' | 'url' | 'email'
required: boolean
placeholder?: string
options?: { value: string; label: string }[]
defaultValue?: string
}
Function Signatures
// Custom hooks (NO business logic in components)

// /src/lib/hooks/useServiceAccounts.ts
export function useServiceAccounts(serviceType: string): {
accounts: ServiceListItem[]
isLoading: boolean
error: string | null
refetch: () => void
deleteAccount: (id: string) => Promise<void>
}

// /src/lib/hooks/useSubResources.ts
export function useSubResources(serviceType: string, accountId: string, subType: string): {
resources: unknown[]
isLoading: boolean
error: string | null
refetch: () => void
createResource: (data: Record<string, unknown>) => Promise<{ resource?: unknown; missing_fields?: string[] }>
deleteResource: (id: string) => Promise<void>
}
Code Skeleton
// /src/app/(dashboard)/services/[type]/page.tsx
// Path: /src/app/(dashboard)/services/[type]/page.tsx
// Module: Service List Page
// Depends on: ../../../../../../components/services/\_shared/AccountList, next/navigation
// Description: Lists all accounts for a service type

import { AccountList } from '@/components/services/\_shared/AccountList'
import { ServiceRegistry } from '@/services/\_registry/ServiceRegistry'
import { notFound } from 'next/navigation'

interface Props {
params: { type: string }
}

export default function ServicePage({ params }: Props) {
if (!ServiceRegistry.has(params.type)) notFound()

return (
<div className="space-y-6">
<AccountList serviceType={params.type} uid="" {/_ uid from session _/} />
</div>
)
}
// /src/components/services/\_shared/AccountList.tsx
// Path: /src/components/services/\_shared/AccountList.tsx
// Module: AccountList
// Depends on: react, ./AccountCard, ./AddAccountModal, ../../lib/hooks/useServiceAccounts
// Description: Account list with search, pagination, add button

'use client'
import { useState } from 'react'
import { AccountCard } from './AccountCard'
import { AddAccountModal } from './AddAccountModal'
import { useServiceAccounts } from '@/lib/hooks/useServiceAccounts'

export function AccountList({ serviceType, uid }: { serviceType: string; uid: string }) {
const [search, setSearch] = useState('')
const [addOpen, setAddOpen] = useState(false)
const { accounts, isLoading, deleteAccount, refetch } = useServiceAccounts(serviceType)

const filtered = accounts.filter(a =>
a.name.toLowerCase().includes(search.toLowerCase())
)

// TODO: implement
// - Search input
// - Grid of AccountCard
// - Skeleton cards while loading
// - Empty state if no accounts
// - "+ Add Account" button → opens AddAccountModal

return (
<div>
{/_ TODO: implement _/}
<AddAccountModal
serviceType={serviceType}
isOpen={addOpen}
onClose={() => setAddOpen(false)}
onSuccess={() => { setAddOpen(false); refetch() }}
/>
</div>
)
}
// /src/components/services/\_shared/AddAccountModal.tsx
// Path: /src/components/services/\_shared/AddAccountModal.tsx
// Module: AddAccountModal
// Depends on: react, zod, ./DynamicForm, ../../lib/hooks/useServiceAccounts
// Description: Modal with dynamic form derived from service Zod schema

'use client'
import { useState } from 'react'
import type { AddAccountModalProps } from './index'

export function AddAccountModal({ serviceType, isOpen, onClose, onSuccess }: AddAccountModalProps) {
const [step, setStep] = useState<'form' | 'loading' | 'success' | 'error'>('form')
const [errorMsg, setErrorMsg] = useState('')

async function handleSubmit(data: Record<string, unknown>) {
// TODO: implement
// 1. setStep('loading')
// 2. POST /api/services/{serviceType} with data
// 3. If 201: setStep('success'), setTimeout → onSuccess(id)
// 4. If 400 (credential invalid): setStep('error'), setErrorMsg
// 5. If network error: setStep('error')
}

if (!isOpen) return null

// TODO: render modal dialog with form → loading spinner → success/error state

return (
<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
{/_ TODO: implement _/}
</div>
)
}
// /src/components/services/\_shared/SubResourcePanel.tsx
// Path: /src/components/services/\_shared/SubResourcePanel.tsx
// Module: SubResourcePanel
// Depends on: react, lucide-react, ../../lib/hooks/useSubResources
// Description: Tabbed panel showing sub-resources with actions

'use client'
import { useState } from 'react'
import { useSubResources } from '@/lib/hooks/useSubResources'
import type { SubResourcePanelProps } from './index'

export function SubResourcePanel({ serviceType, accountId, uid, subResourceType }: SubResourcePanelProps) {
const [createFormData, setCreateFormData] = useState<Record<string, string>>({})
const [showCreateForm, setShowCreateForm] = useState(false)
const { resources, isLoading, createResource, deleteResource, refetch } = useSubResources(
serviceType, accountId, subResourceType.type
)

async function handleCreate() {
// TODO: implement
// 1. createResource(createFormData)
// 2. If missing_fields returned: show inline form with defaults
// 3. Else: refetch()
}

// TODO: render resource list table + action buttons + create form

return (
<div className="space-y-4">
{/_ TODO: implement _/}
</div>
)
}
Import Map
[type]/page.tsx → @/components/services/\_shared/AccountList, @/services/\_registry/ServiceRegistry, next/navigation
[type]/[id]/page.tsx → @/components/services/\_shared/SubResourcePanel, @/lib/hooks/useServiceDetail
AccountList.tsx → react, ./AccountCard, ./AddAccountModal, @/lib/hooks/useServiceAccounts
AccountCard.tsx → react, lucide-react, date-fns
AddAccountModal.tsx → react, zod
SubResourcePanel.tsx → react, lucide-react, @/lib/hooks/useSubResources
hooks/useServiceAccounts.ts → react, @/lib/store/ServiceStore, @/lib/db/LocalDb
hooks/useSubResources.ts → react, swr or react-query
Test Cases
// TC-502-01: AccountList renders skeleton while loading
// TC-502-02: AccountList renders accounts correctly from hook
// TC-502-03: AddAccountModal submit calls POST /api/services/{type}
// TC-502-04: AddAccountModal shows error toast on 400 response
// TC-502-05: AddAccountModal shows success and calls onSuccess with id
// TC-502-06: SubResourcePanel renders list of resources
// TC-502-07: SubResourcePanel shows inline form when missing_fields returned
// TC-502-08: No business logic in components — all logic in hooks
// TC-502-09: Delete account triggers DELETE /api/services/{type}/{id}
// TC-502-10: Service detail page has 4 tabs: Overview | Sub-resources | Logs | Export
T-503 · Operation Log & Audit Log UI
Status: TODO
Wave: 8
Phụ thuộc: T-103, T-502
Agent: unassigned
Type Definitions
// Log UI types

export interface LogFilters {
action?: string
from?: Date | null
to?: Date | null
serviceType?: string
result?: 'SUCCESS' | 'FAILURE' | 'ALL'
}

export interface AuditLogTableProps {
uid: string
filters: LogFilters
}

export interface OperationLogDrawerProps {
operation: OperationLog | null
isOpen: boolean
onClose: () => void
onReplay?: (op: OperationLog) => void
}

export interface ApiCallDetailProps {
operation: OperationLog
}
Code Skeleton
// /src/components/logs/AuditLogTable.tsx
// Path: /src/components/logs/AuditLogTable.tsx
// Module: AuditLogTable
// Depends on: react, date-fns, lucide-react, ./ApiCallDetail
// Description: Virtual-scrolled audit log table with filters

'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { AuditLogTableProps } from './index'
import type { AuditEntry } from '@/lib/logger/index'

export function AuditLogTable({ uid, filters }: AuditLogTableProps) {
const [logs, setLogs] = useState<AuditEntry[]>([])
const [isLoading, setIsLoading] = useState(true)
const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null)

useEffect(() => {
// TODO: fetch /api/admin/logs with filters params
// setLogs, setIsLoading(false)
}, [uid, filters])

// TODO: implement table with:
// Columns: Time | Actor | Action | Target | Result | Duration
// - Result: colored badge (green SUCCESS / red FAILURE)
// - Duration: formatted ms
// - Row click → setSelectedLog → ApiCallDetail slide-over
// - Virtual scroll for 100+ rows (use react-virtual or CSS overflow)

return (
<div className="overflow-hidden rounded-lg border border-slate-800">
{/_ TODO: implement _/}
</div>
)
}
Import Map
logs/page.tsx → @/components/logs/AuditLogTable, @/components/logs/OperationLogDrawer
AuditLogTable.tsx → react, date-fns, lucide-react, @/lib/logger/index (types)
OperationLogDrawer.tsx → react, lucide-react, @/lib/logger/index (types)
ApiCallDetail.tsx → react, @/lib/logger/index (types)
Test Cases
// TC-503-01: AuditLogTable renders 100 rows without performance issues (<100ms render)
// TC-503-02: Filter by action 'SERVICE_CREATE' shows only those entries
// TC-503-03: Filter by date range excludes out-of-range entries
// TC-503-04: Row click opens ApiCallDetail with correct data
// TC-503-05: ApiCallDetail masks Authorization header
// TC-503-06: Replay button calls API with same parameters
// TC-503-07: Result badge is green for SUCCESS, red for FAILURE
═══════════════════════════════════════════════
🔶 NHÓM 6 — EXPORT/IMPORT
═══════════════════════════════════════════════
T-601 · Export/Import System
Status: TODO
Wave: 9
Phụ thuộc: T-302, T-401..T-405
Agent: unassigned
Type Definitions
// /src/lib/export/index.ts

export interface ExportOptions {
scope: ServiceType | 'all'
ids?: string[] // if empty: export all in scope
format: 'json' | 'csv'
uid: string
}

export interface ImportOptions {
uid: string
skipDuplicates?: boolean // default true
}

export interface ValidationResult {
valid: boolean
errors: Array<{ field: string; message: string }>
warnings: Array<{ field: string; message: string }>
}

export interface ImportResult {
imported: number
skipped: number
errors: Array<{ id: string; error: string }>
}

// ExportPayload — from /src/types/service.d.ts (re-used)
// { version, exported_at, exported_by, scope, schema_version, data, checksum }
Function Signatures
// /src/lib/export/ExportBuilder.ts

export class ExportBuilder {
async build(options: ExportOptions): Promise<ExportPayload | string>
// json: ExportPayload with AES-encrypted credentials
// csv: string (credentials masked as '\*\*\*')

private async collectData(uid: string, scope: string, ids?: string[]): Promise<Record<string, unknown>>
private calculateChecksum(data: unknown): string
// sha256(JSON.stringify(data))
private toJson(data: unknown, uid: string, scope: string): ExportPayload
private toCsv(data: unknown): string
}

// /src/lib/export/ImportValidator.ts

export class ImportValidator {
validate(payload: unknown): ValidationResult
// Check: valid JSON, has required fields, schema_version compatible, checksum matches

private checkChecksum(payload: ExportPayload): boolean
private checkSchemaVersion(version: string): boolean
// Only version '1' supported currently

private checkForDuplicates(payload: ExportPayload, existingIds: string[]): string[]
}

// /src/lib/export/formats/JsonExporter.ts

export function buildJsonExport(
data: Record<string, unknown>,
uid: string,
scope: string
): ExportPayload

// /src/lib/export/formats/CsvExporter.ts

export function buildCsvExport(data: Record<string, unknown>): string
// Columns: id, serviceType, name, status, createdAt, [config fields...], credentials=\*\*\*
Code Skeleton
// /src/lib/export/ExportBuilder.ts
// Path: /src/lib/export/ExportBuilder.ts
// Module: ExportBuilder
// Depends on: crypto (sha256), ../../services/\_registry/ServiceRegistry,
// ./formats/JsonExporter, ./formats/CsvExporter
// Description: Builds export payloads in JSON or CSV format

import { createHash } from 'crypto'
import { ServiceRegistry } from '../../services/\_registry/ServiceRegistry'
import { buildJsonExport } from './formats/JsonExporter'
import { buildCsvExport } from './formats/CsvExporter'
import type { ExportOptions, ExportPayload } from './index'

export class ExportBuilder {
async build(options: ExportOptions): Promise<ExportPayload | string> {
// TODO: implement
// 1. const data = await this.collectData(options.uid, options.scope, options.ids)
// 2. if format === 'json': return buildJsonExport(data, uid, scope) — credentials STAY ENCRYPTED
// 3. if format === 'csv': return buildCsvExport(data) — credentials masked as '\*\*\*'
throw new Error('Not implemented')
}

private async collectData(
uid: string,
scope: string,
ids?: string[]
): Promise<Record<string, unknown>> {
// TODO: implement
// If scope === 'all': iterate all registered service types
// Else: just that service type
// For each service: service.list(uid) → filter by ids if provided
// For each account: service.load(uid, id) — returns ENCRYPTED credentials
throw new Error('Not implemented')
}

calculateChecksum(data: unknown): string {
return createHash('sha256').update(JSON.stringify(data)).digest('hex')
}
}
// /src/lib/export/ImportValidator.ts
// Path: /src/lib/export/ImportValidator.ts
// Module: ImportValidator
// Depends on: crypto (sha256), zod
// Description: Validates import payloads before processing

import { createHash } from 'crypto'
import { z } from 'zod'
import type { ValidationResult, ExportPayload } from './index'

const exportPayloadSchema = z.object({
version: z.literal('1.0'),
exported_at: z.string(),
exported_by: z.string(),
scope: z.string(),
schema_version: z.literal('1'),
data: z.record(z.unknown()),
checksum: z.string(),
})

export class ImportValidator {
validate(payload: unknown): ValidationResult {
// TODO: implement
// 1. exportPayloadSchema.safeParse(payload) — collect schema errors
// 2. If valid schema: checkChecksum(payload as ExportPayload) — add error if mismatch
// 3. checkSchemaVersion — add warning if newer schema detected
// 4. Return { valid: errors.length === 0, errors, warnings }
throw new Error('Not implemented')
}

private checkChecksum(payload: ExportPayload): boolean {
// TODO: implement
// Recompute sha256(JSON.stringify({ ...payload, checksum: undefined }))
// Compare with payload.checksum
throw new Error('Not implemented')
}

private checkSchemaVersion(version: string): boolean {
return version === '1'
}
}
Import Map
ExportBuilder.ts → crypto, ../../services/\_registry/ServiceRegistry,
./formats/JsonExporter, ./formats/CsvExporter
ImportValidator.ts → crypto, zod
formats/JsonExporter.ts → (no external deps)
formats/CsvExporter.ts → (no external deps)
export/page.tsx → react, @/lib/export/ExportBuilder
api/services/export/route.ts → @/lib/auth/withAuth, @/lib/export/ExportBuilder
api/services/import/route.ts → @/lib/auth/withAuth, @/lib/export/ImportValidator, ServiceRegistry
Test Cases
// /tests/unit/ExportImport.test.ts

describe('ExportBuilder', () => {
const builder = new ExportBuilder()

// TC-601-01: JSON export has correct structure
test('JSON export has all required ExportPayload fields', async () => {
const payload = await builder.build({
scope: 'github', uid: 'test-uid', format: 'json'
}) as ExportPayload
expect(payload.version).toBe('1.0')
expect(payload.schema_version).toBe('1')
expect(payload.checksum).toBeDefined()
expect(typeof payload.data).toBe('object')
})

// TC-601-02: Credentials stay encrypted in JSON export
test('JSON export credentials are encrypted (not plaintext)', async () => {
const payload = await builder.build({
scope: 'github', uid: 'uid-with-data', format: 'json'
}) as ExportPayload
const dataStr = JSON.stringify(payload.data)
// Should not find plaintext token patterns
expect(dataStr).not.toMatch(/^ghp\_[A-Za-z0-9]+/)
})

// TC-601-03: CSV export masks credentials
test('CSV export masks credentials with **_', async () => {
const csv = await builder.build({
scope: 'github', uid: 'uid-with-data', format: 'csv'
}) as string
expect(csv).not.toMatch(/ghp\_/) // no GitHub tokens
expect(csv).toContain('_**')
})

// TC-601-04: Checksum calculation is deterministic
test('same data produces same checksum', () => {
const data = { test: 'value', count: 42 }
expect(builder.calculateChecksum(data)).toBe(builder.calculateChecksum(data))
})
})

describe('ImportValidator', () => {
const validator = new ImportValidator()

// TC-601-05: Valid payload passes validation
test('valid export payload passes validation', () => {
const builder = new ExportBuilder()
const data = { accounts: [] }
const checksum = builder.calculateChecksum(data)
const payload: ExportPayload = {
version: '1.0',
exported_at: new Date().toISOString(),
exported_by: 'uid1',
scope: 'github',
schema_version: '1',
data,
checksum,
}
const result = validator.validate(payload)
expect(result.valid).toBe(true)
expect(result.errors).toHaveLength(0)
})

// TC-601-06: Tampered checksum fails validation
test('tampered checksum fails validation', () => {
const payload: ExportPayload = {
version: '1.0',
exported_at: new Date().toISOString(),
exported_by: 'uid1',
scope: 'github',
schema_version: '1',
data: { tampered: 'data' },
checksum: 'invalid-checksum-value',
}
const result = validator.validate(payload)
expect(result.valid).toBe(false)
expect(result.errors.some(e => e.field === 'checksum')).toBe(true)
})

// TC-601-07: Export → Import round trip preserves data
test('export then import preserves account count', async () => {
// Setup: have 2 github accounts for test-uid
const builder = new ExportBuilder()
const payload = await builder.build({ scope: 'github', uid: 'test-uid', format: 'json' }) as ExportPayload
const validation = validator.validate(payload)
expect(validation.valid).toBe(true)
// Then import and verify count
})
})
═══════════════════════════════════════════════
🔴 NHÓM 7 — PERFORMANCE & POLISH
═══════════════════════════════════════════════
T-701 · Performance Optimization
Status: TODO
Wave: 8 (parallel)
Phụ thuộc: T-502
Agent: unassigned
Type Definitions
// /src/lib/hooks/useServiceList.ts

export interface UseServiceListReturn {
ids: string[]
isLoading: boolean
error: string | null
cursor: string | null
hasMore: boolean
loadMore: () => Promise<void>
}

// /src/lib/hooks/useServiceDetail.ts

export interface UseServiceDetailReturn {
detail: LocalServiceDetail | null
isLoading: boolean
error: string | null
refetch: () => Promise<void>
}

// /src/lib/hooks/useInfiniteList.ts

export interface UseInfiniteListOptions<T> {
fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>
pageSize?: number
}

export interface UseInfiniteListReturn<T> {
items: T[]
isLoading: boolean
isFetchingMore: boolean
hasMore: boolean
loadMore: () => void
error: string | null
}
Function Signatures
// /src/lib/hooks/useServiceList.ts
export function useServiceList(uid: string, serviceType: string): UseServiceListReturn

// /src/lib/hooks/useServiceDetail.ts
export function useServiceDetail(id: string | null): UseServiceDetailReturn
// Caches in IndexedDB — returns cached immediately, refetches in background

// /src/lib/hooks/useInfiniteList.ts
export function useInfiniteList<T>(options: UseInfiniteListOptions<T>): UseInfiniteListReturn<T>
// Uses IntersectionObserver for auto-trigger

// /src/components/services/\_shared/VirtualList.tsx
export function VirtualList<T>({ items, renderItem, itemHeight }: {
items: T[]
renderItem: (item: T, index: number) => React.ReactNode
itemHeight: number
}): JSX.Element
Code Skeleton
// /src/lib/hooks/useServiceList.ts
// Path: /src/lib/hooks/useServiceList.ts
// Module: useServiceList
// Depends on: react, ../db/LocalDb, ../firebase/ShardManager
// Description: IDs-first loading hook with cursor pagination

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db/LocalDb'
import { ShardManager } from '@/lib/firebase/ShardManager'
import type { UseServiceListReturn } from './index'

export function useServiceList(uid: string, serviceType: string): UseServiceListReturn {
const [ids, setIds] = useState<string[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [cursor, setCursor] = useState<string | null>(null)
const [hasMore, setHasMore] = useState(false)

const load = useCallback(async () => {
// TODO: implement
// 1. setIsLoading(true)
// 2. Try local: await db.services.where({ uid, serviceType }).primaryKeys()
// 3. setIds(localIds), setIsLoading(false)
// 4. Background refresh: ShardManager.getInstance().list(uid, serviceType)
// 5. Update local DB, update ids if changed
}, [uid, serviceType])

const loadMore = useCallback(async () => {
// TODO: implement cursor-based next page
}, [cursor, uid, serviceType])

useEffect(() => { load() }, [load])

return { ids, isLoading, error, cursor, hasMore, loadMore }
}
// /src/lib/hooks/useServiceDetail.ts
// Path: /src/lib/hooks/useServiceDetail.ts
// Module: useServiceDetail
// Depends on: react, ../db/LocalDb, date-fns (isAfter)
// Description: Lazy detail loader with IndexedDB cache

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/LocalDb'
import type { UseServiceDetailReturn } from './index'
import type { LocalServiceDetail } from '@/lib/db/index'

const CACHE_TTL_MS = 5 _ 60 _ 1000 // 5 minutes

export function useServiceDetail(id: string | null): UseServiceDetailReturn {
const [detail, setDetail] = useState<LocalServiceDetail | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const refetch = async () => {
if (!id) return
// TODO: implement
// 1. setIsLoading(true)
// 2. Local check: const cached = await db.service_details.get(id)
// 3. If cached && (Date.now() - cached.updatedAt) < CACHE_TTL_MS: setDetail(cached), setIsLoading(false); return
// 4. Else: GET /api/services/{serviceType}/{id} → setDetail, save to db
}

useEffect(() => {
if (!id) { setDetail(null); return }
refetch()
}, [id])

return { detail, isLoading, error, refetch }
}
Import Map
useServiceList.ts → react, @/lib/db/LocalDb, @/lib/firebase/ShardManager
useServiceDetail.ts → react, @/lib/db/LocalDb
useInfiniteList.ts → react (useCallback, useRef, useEffect for IntersectionObserver)
VirtualList.tsx → react
Test Cases
// /tests/unit/useServiceList.test.ts

describe('useServiceList', () => {
// TC-701-01: Serves from cache immediately
test('returns cached IDs immediately before RTDB response', async () => {
// Pre-populate IndexedDB
await db.services.add({ id: 'cached-id', uid: 'uid1', serviceType: 'github', name: 'test', shardId: 's1', meta: {}, updatedAt: Date.now() })
const { result } = renderHook(() => useServiceList('uid1', 'github'))
// Should have data before RTDB responds
await waitFor(() => expect(result.current.ids).toContain('cached-id'))
})

// TC-701-02: Detail from cache under 300ms
test('useServiceDetail returns cached detail under 300ms', async () => {
const start = Date.now()
const { result } = renderHook(() => useServiceDetail('cached-detail-id'))
await waitFor(() => result.current.detail !== null)
expect(Date.now() - start).toBeLessThan(300)
})

// TC-701-03: VirtualList renders 1000 items without freeze
test('VirtualList renders 1000 items', () => {
const items = Array.from({ length: 1000 }, (\_, i) => ({ id: String(i), name: `Item ${i}` }))
const start = performance.now()
render(<VirtualList items={items} renderItem={(item) => <div key={item.id}>{item.name}</div>} itemHeight={60} />)
expect(performance.now() - start).toBeLessThan(100)
})
})
T-702 · Error Boundary & Loading States
Status: TODO
Wave: 8
Phụ thuộc: T-501
Agent: unassigned
Type Definitions
// /src/components/ui/ErrorBoundary.tsx
export interface ErrorBoundaryProps {
children: React.ReactNode
fallback?: React.ReactNode
onError?: (error: Error, info: React.ErrorInfo) => void
}

export interface ErrorBoundaryState {
hasError: boolean
error: Error | null
}

// /src/components/ui/SkeletonCard.tsx
export interface SkeletonCardProps {
lines?: number
hasAvatar?: boolean
className?: string
}

// /src/components/ui/EmptyState.tsx
export interface EmptyStateProps {
title: string
description: string
icon?: string // lucide icon name
action?: {
label: string
onClick: () => void
}
}
Code Skeleton
// /src/components/ui/ErrorBoundary.tsx
// Path: /src/components/ui/ErrorBoundary.tsx
// Module: ErrorBoundary
// Depends on: react
// Description: Class-based error boundary — prevents full-app crash

import { Component } from 'react'
import type { ErrorBoundaryProps, ErrorBoundaryState } from './index'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
state: ErrorBoundaryState = { hasError: false, error: null }

static getDerivedStateFromError(error: Error): ErrorBoundaryState {
return { hasError: true, error }
}

componentDidCatch(error: Error, info: React.ErrorInfo) {
// TODO: implement
// this.props.onError?.(error, info)
// Console.error in dev, report to monitoring in prod
}

render() {
if (this.state.hasError) {
return this.props.fallback ?? (
<div className="flex flex-col items-center justify-center p-12 text-slate-400">
{/_ TODO: error UI with retry button _/}
</div>
)
}
return this.props.children
}
}
// /src/components/ui/SkeletonCard.tsx
// Path: /src/components/ui/SkeletonCard.tsx
// Module: SkeletonCard
// Depends on: react
// Description: Animated skeleton placeholder for loading states

export function SkeletonCard({ lines = 3, hasAvatar = false, className = '' }: SkeletonCardProps) {
// TODO: implement
// Animated pulse div with rounded rect shapes
// If hasAvatar: circular skeleton + text lines
// Lines: multiple rounded rect skeletons of varying widths

return (
<div className={`p-4 rounded-lg bg-slate-800 animate-pulse ${className}`}>
{/_ TODO: implement skeleton shapes _/}
</div>
)
}
// /src/components/ui/EmptyState.tsx
// Path: /src/components/ui/EmptyState.tsx
// Depends on: react, lucide-react
// Description: Empty state UI with CTA button

import { Box } from 'lucide-react'

export function EmptyState({ title, description, icon = 'box', action }: EmptyStateProps) {
// TODO: implement
// Center-aligned icon + title + description + optional action button
// Lucide icon name → dynamic icon component

return (
<div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
{/_ TODO: implement _/}
</div>
)
}
Test Cases
// TC-702-01: ErrorBoundary catches thrown error and renders fallback
// TC-702-02: ErrorBoundary calls onError prop when error occurs
// TC-702-03: ErrorBoundary does not crash the whole app — siblings still render
// TC-702-04: SkeletonCard renders correct number of lines
// TC-702-05: SkeletonCard has animate-pulse class
// TC-702-06: EmptyState renders action button when provided
// TC-702-07: EmptyState calls action.onClick when button clicked
// TC-702-08: /app/error.tsx renders ErrorBoundary with retry option
═══════════════════════════════════════════════
⚫ NHÓM 8 — DEVOPS & DOCS
═══════════════════════════════════════════════
T-801 · Docker & Deployment Config
Status: TODO
Wave: Bất kỳ
Phụ thuộc: Không
Agent: unassigned
Files cần tạo
/Dockerfile
/docker-compose.yml
/docker-compose.prod.yml
/.github/workflows/ci.yml
/scripts/generate-encryption-key.sh
Code Skeleton

# /Dockerfile

# Path: /Dockerfile

# Multi-stage build: deps → builder → runner

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# /docker-compose.yml

# Path: /docker-compose.yml

version: '3.9'
services:
app:
build: .
ports: - '3000:3000'
environment: - NODE_ENV=development - NEXTAUTH_URL=http://localhost:3000
env_file: .env
restart: unless-stopped
healthcheck:
test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/api/health']
interval: 30s
timeout: 10s
retries: 3

# /.github/workflows/ci.yml

# Path: /.github/workflows/ci.yml

name: CI

on:
push:
branches: [main, develop]
pull_request:
branches: [main]

jobs:
ci:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4 - uses: actions/setup-node@v4
with:
node-version: '20'
cache: 'npm' - run: npm ci - run: npm run typecheck - run: npm run lint - run: npm test -- --passWithNoTests - run: npm run build
#!/bin/bash

# /scripts/generate-encryption-key.sh

# Path: /scripts/generate-encryption-key.sh

# Description: Generate AES-256 key and IV salt for .env

echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "ENCRYPTION_IV_SALT=$(openssl rand -hex 16)"
Test Cases
// TC-801-01: docker-compose up starts app on port 3000
// TC-801-02: GET http://localhost:3000/api/health returns 200
// TC-801-03: docker-compose up --scale app=3 → all 3 instances healthy
// TC-801-04: CI workflow: typecheck step exits 0
// TC-801-05: CI workflow: test step exits 0
// TC-801-06: CI workflow: build step produces .next/standalone
// TC-801-07: generate-encryption-key.sh outputs 64-char hex ENCRYPTION_KEY
T-802 · STANDARDS.md hoàn chỉnh
Status: TODO
Wave: 1 (sau T-001)
Phụ thuộc: T-001
Agent: unassigned
Nội dung STANDARDS.md phải có

# /STANDARDS.md — Coding Standards

## 1. Naming Conventions

- Files: PascalCase for classes/components, camelCase for hooks/utils
- DB paths: /{uid}/services/{service_type}/{record_id}
- Env vars: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase, prefix 'I' NOT used
- Error codes: [MODULE]-[TYPE]-[3-digit-number]

## 2. Error Code Registry

[Full list of all error codes by module]

## 3. API Response Format

{ data?: T, error?: { code, message, details }, meta?: { cursor, total, duration_ms } }

## 4. Zod Schema Patterns

[Standard patterns for request validation]

## 5. Git Branching Strategy

main → production, develop → staging, feature/T-XXX-slug → feature

## 6. PR/Review Checklist

[ ] TypeScript: no `any` without comment
[ ] Tests: all new functions have tests
[ ] Audit log: all write operations logged
[ ] No secrets hardcoded
[ ] API routes: Zod validation
Test Cases
// TC-802-01: /STANDARDS.md exists
// TC-802-02: Contains section "Naming Conventions"
// TC-802-03: Contains section "Error Code Registry" with at least 10 codes
// TC-802-04: Contains section "API Response Format"
// TC-802-05: Contains section "Zod Schema Patterns"
// TC-802-06: Contains section "Git Branching Strategy"
// TC-802-07: Contains section "PR/Review Checklist"
T-803 · PROJECT_MEMORY.md khởi tạo
Status: TODO
Wave: 1
Phụ thuộc: Không
Agent: unassigned
Nội dung cần có

# /PROJECT_MEMORY.md

project: multi-service-integrator
version: 0.1.0
tech_stack:
frontend: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui
backend: Next.js API Routes, Firebase Admin SDK
database: Firebase RTDB (multi-shard)
auth: NextAuth v5
state: Zustand + IndexedDB (Dexie)
crypto: Node.js crypto (AES-256-GCM)

current_agent: null

tasks:

- task_id: T-001
  title: "Project Bootstrap"
  status: TODO
  agent: null

# ... all 23 tasks

found_bugs: []

notes: "Initial project memory. All tasks TODO."
Test Cases
// TC-803-01: /PROJECT_MEMORY.md exists
// TC-803-02: Contains all 23 task IDs (T-001 through T-803)
// TC-803-03: All tasks have status: TODO initially
// TC-803-04: Format matches AGENTS.md section 11 schema
// TC-803-05: tech_stack section is present
═══════════════════════════════════════════════
📊 TỔNG KẾT & TRIỂN KHAI
═══════════════════════════════════════════════
Thứ tự triển khai (Wave Plan)
Wave 1 (tuần tự): T-001 → T-803 → T-802
Wave 2 (tuần tự): T-101 → T-102 → T-103 → T-104
Wave 3 (parallel): T-201 ‖ T-801
Wave 4 (tuần tự): T-202
Wave 5 (parallel): T-301 ‖ T-501
Wave 6 (tuần tự): T-302
Wave 7 (parallel): T-401 ‖ T-402 ‖ T-403 ‖ T-404 ‖ T-405
Wave 8 (parallel): T-502 ‖ T-503 ‖ T-701 ‖ T-702
Wave 9 (parallel): T-601
Quick Reference: Error Codes
Module Code Meaning
GitHub GH-AUTH-001 Token invalid
GitHub GH-AUTH-002 Token expired
GitHub GH-API-001 Rate limited
GitHub GH-API-002 Repo not found
GitHub GH-HOOK-001 Hook URL unreachable
Cloudflare CF-AUTH-001 Invalid API key/token
Cloudflare CF-API-001 Rate limited
Cloudflare CF-API-002 Zone not found
Cloudflare CF-TUN-001 Tunnel creation failed
Cloudflare CF-TUN-002 Tunnel already exists
Supabase SB-AUTH-001 Invalid service role key
Supabase SB-API-001 Project not found
Supabase SB-MGMT-001 Management token required
Resend RS-AUTH-001 Invalid API key
Resend RS-DOM-001 Domain not verified
Google GC-AUTH-001 Invalid credentials
Google GC-API-001 Insufficient permissions
Google GC-SA-001 Service account JSON invalid
DB DB-SHARD-001 No shards configured
DB DB-SHARD-002 Shard not found
DB DB-SHARD-003 No available shard
Auth AUTH-JWT-001 JWT expired/missing
Auth AUTH-ROLE-001 Insufficient role
Encrypt ENC-AES-001 Decrypt failed
Encrypt ENC-AES-002 Invalid key
Quick Reference: RTDB Data Structure
/users/{uid}/
email, displayName, role, lastLogin, authProvider, createdAt

/{uid}/services/{service_type}/{record_id}/
\_meta: { created_at, updated_at, version, schema_v }
credentials: { [field]: "AES_ENCRYPTED_BASE64" }
config: { [field]: value }
sub_resources: { [type]: { [id]: {...} } }

/shard_index/{uid}/{service_type}/{record_id}
→ { shardId: "shard_1", createdAt: ISO8601 }

/audit_logs/{uid}/{log_id}/
→ AuditEntry

/meta/load → number (for health checks)
Checklist khi agent nhận task

1. ✅ Đọc task spec đầy đủ
2. ✅ Đọc type definitions — implement CHÍNH XÁC
3. ✅ Implement từng skeleton theo thứ tự: types → utils → service → API → UI
4. ✅ present_files() ngay sau mỗi file
5. ✅ Chạy test cases — PHẢI PASS trước khi mark DONE
6. ✅ Cập nhật PROJECT_MEMORY.md
7. ✅ Không sửa file ngoài scope
