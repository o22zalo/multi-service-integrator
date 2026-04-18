import { AuditLogger } from '@/lib/logger/AuditLogger'

describe('AuditLogger', () => {
  test('getInstance returns same instance', () => {
    expect(AuditLogger.getInstance()).toBe(AuditLogger.getInstance())
  })
})
