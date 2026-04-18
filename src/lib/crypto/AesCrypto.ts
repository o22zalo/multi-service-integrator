// Path: /src/lib/crypto/AesCrypto.ts
// Module: AES-256-GCM Crypto
// Depends on: crypto
// Description: Encrypts and decrypts secrets using AES-256-GCM.
// Fix: encryptObject / decryptObject now forward the optional keyHex parameter so
//      they can be used in unit tests without a live ENCRYPTION_KEY env var.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export const ENCRYPTED_FIELDS: Record<string, string[]> = {
  github: ['token', 'webhook_secret'],
  cloudflare: ['api_key', 'api_token'],
  supabase: ['service_role_key', 'anon_key', 'access_token'],
  resend: ['api_key'],
  'google-creds': ['client_secret', 'json_key', 'key'],
}

function getKey(keyHex?: string): Buffer {
  const hex = keyHex ?? process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENC-AES-002: Invalid encryption key — must be 32-byte hex (64 chars)')
  }
  return Buffer.from(hex, 'hex')
}

/** Encrypts plaintext into base64(iv + authTag + ciphertext). */
export function encrypt(plaintext: string, keyHex?: string): string {
  const key = getKey(keyHex)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

/** Decrypts a base64 payload created by encrypt(). */
export function decrypt(ciphertext: string, keyHex?: string): string {
  try {
    const key = getKey(keyHex)
    const buf = Buffer.from(ciphertext, 'base64')
    const iv = buf.subarray(0, IV_LENGTH)
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const plaintext = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])
    return plaintext.toString('utf8')
  } catch {
    throw new Error('ENC-AES-001: Decrypt failed')
  }
}

/**
 * Returns a shallow copy of the object with specific fields encrypted.
 * The optional `keyHex` parameter is forwarded to `encrypt()` and is useful
 * when calling this function from tests without a live ENCRYPTION_KEY env var.
 */
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  keyHex?: string,
): T {
  const clone = { ...obj } as Record<string, unknown>
  for (const field of fields) {
    if (clone[field] !== undefined && clone[field] !== null) {
      clone[field] = encrypt(String(clone[field]), keyHex)
    }
  }
  return clone as T
}

/**
 * Returns a shallow copy of the object with specific fields decrypted.
 * The optional `keyHex` parameter is forwarded to `decrypt()`.
 */
export function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  keyHex?: string,
): T {
  const clone = { ...obj } as Record<string, unknown>
  for (const field of fields) {
    if (typeof clone[field] === 'string' && clone[field]) {
      clone[field] = decrypt(String(clone[field]), keyHex)
    }
  }
  return clone as T
}
