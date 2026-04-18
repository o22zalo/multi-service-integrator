import { LocalDb, db } from '@/lib/db/LocalDb'
import { SyncManager } from '@/lib/db/SyncManager'
import { useServiceStore } from '@/lib/store/ServiceStore'

describe('LocalDb', () => {
  test('db initializes without throwing', () => {
    expect(() => new LocalDb()).not.toThrow()
  })

  test('all required tables exist', () => {
    expect(db.services).toBeDefined()
    expect(db.service_details).toBeDefined()
    expect(db.audit_logs).toBeDefined()
    expect(db.operation_logs).toBeDefined()
    expect(db.sync_queue).toBeDefined()
  })
})

describe('SyncManager', () => {
  test('getInstance returns same instance', () => {
    expect(SyncManager.getInstance()).toBe(SyncManager.getInstance())
  })
})

describe('ServiceStore', () => {
  test('initial state has empty serviceIds', () => {
    expect(useServiceStore.getState().serviceIds).toEqual([])
  })

  test('selectService updates selectedServiceId', () => {
    useServiceStore.getState().selectService('acc-123')
    expect(useServiceStore.getState().selectedServiceId).toBe('acc-123')
  })

  test('reset clears state', () => {
    useServiceStore.getState().selectService('some-id')
    useServiceStore.getState().reset()
    expect(useServiceStore.getState().selectedServiceId).toBeNull()
  })
})
