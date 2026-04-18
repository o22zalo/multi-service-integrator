import { decrypt, decryptObject, encrypt, encryptObject } from '@/lib/crypto/AesCrypto'

describe('AesCrypto', () => {
  const TEST_KEY = 'a'.repeat(64)

  test('encrypt then decrypt returns original', () => {
    const original = 'my-secret-token-123'
    const encrypted = encrypt(original, TEST_KEY)
    const decrypted = decrypt(encrypted, TEST_KEY)
    expect(decrypted).toBe(original)
  })

  test('same plaintext gives different ciphertext each call', () => {
    const plain = 'same-input'
    const c1 = encrypt(plain, TEST_KEY)
    const c2 = encrypt(plain, TEST_KEY)
    expect(c1).not.toBe(c2)
  })

  test('decrypt with wrong key throws ENC-AES-001', () => {
    const encrypted = encrypt('secret', TEST_KEY)
    const wrongKey = 'b'.repeat(64)
    expect(() => decrypt(encrypted, wrongKey)).toThrow('ENC-AES-001')
  })

  test('encrypt with invalid key throws ENC-AES-002', () => {
    expect(() => encrypt('secret', 'tooshort')).toThrow('ENC-AES-002')
  })

  test('encryptObject encrypts only listed fields', () => {
    const obj = { token: 'secret', name: 'public', extra: 'data' }
    const result = encryptObject(obj, ['token'])
    expect(result.token).not.toBe('secret')
    expect(result.name).toBe('public')
    expect(result.extra).toBe('data')
  })

  test('encryptObject → decryptObject returns original', () => {
    const obj = { token: 'my-token', webhook_secret: 'wh-secret', name: 'github-main' }
    const fields = ['token', 'webhook_secret']
    const encrypted = encryptObject(obj, fields)
    const decrypted = decryptObject(encrypted, fields)
    expect(decrypted).toEqual(obj)
  })
})
