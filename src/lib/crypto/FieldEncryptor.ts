// Path: /src/lib/crypto/FieldEncryptor.ts
// Module: FieldEncryptor
// Depends on: ./AesCrypto
// Description: Service-aware encryption helpers.

import { decryptObject, encryptObject, ENCRYPTED_FIELDS } from './AesCrypto'

/** Encrypts service-specific credential fields on a payload. */
export function encryptService<T extends Record<string, unknown>>(serviceType: string, data: T): T {
  const fields = ENCRYPTED_FIELDS[serviceType] ?? []
  return encryptObject(data, fields)
}

/** Decrypts service-specific credential fields on a payload. */
export function decryptService<T extends Record<string, unknown>>(serviceType: string, data: T): T {
  const fields = ENCRYPTED_FIELDS[serviceType] ?? []
  return decryptObject(data, fields)
}
