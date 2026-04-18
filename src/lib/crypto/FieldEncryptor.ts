// Path: /src/lib/crypto/FieldEncryptor.ts
// Module: FieldEncryptor
// Depends on: ./AesCrypto
// Description: Service-aware encryption helpers.
// Fix: encryptService / decryptService now forward the optional keyHex so
//      callers (tests, CLI tools) can supply a key without touching process.env.

import { decryptObject, encryptObject, ENCRYPTED_FIELDS } from './AesCrypto'

/**
 * Encrypts service-specific credential fields on a payload.
 * @param serviceType  Registered service key (e.g. 'github', 'resend').
 * @param data         Object whose credential fields will be encrypted.
 * @param keyHex       Optional 64-char hex key; falls back to ENCRYPTION_KEY env var.
 */
export function encryptService<T extends Record<string, unknown>>(
  serviceType: string,
  data: T,
  keyHex?: string,
): T {
  const fields = ENCRYPTED_FIELDS[serviceType] ?? []
  return encryptObject(data, fields, keyHex)
}

/**
 * Decrypts service-specific credential fields on a payload.
 * @param serviceType  Registered service key.
 * @param data         Object whose credential fields will be decrypted.
 * @param keyHex       Optional 64-char hex key; falls back to ENCRYPTION_KEY env var.
 */
export function decryptService<T extends Record<string, unknown>>(
  serviceType: string,
  data: T,
  keyHex?: string,
): T {
  const fields = ENCRYPTED_FIELDS[serviceType] ?? []
  return decryptObject(data, fields, keyHex)
}
