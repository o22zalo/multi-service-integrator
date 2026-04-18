import { BaseService } from '@/services/_base/BaseService'
import { ServiceRegistry } from '@/services/_registry/ServiceRegistry'

class MockService extends BaseService<
  { owner: string },
  { token: string },
  { id: string; name: string }
> {
  readonly SERVICE_TYPE = 'mock'
  readonly SERVICE_LABEL = 'Mock'
  readonly CREDENTIAL_FIELDS = ['token']
  readonly ICON = 'box'
  readonly DESCRIPTION = 'Mock service for testing'

  async validateCredentials(creds: { token: string }) {
    return creds.token === 'valid-token'
  }

  async fetchMetadata() {
    return { owner: 'test-owner' }
  }

  getSubResourceTypes() {
    return []
  }

  async fetchSubResources() {
    return []
  }

  async createSubResource() {
    return { id: '1', name: 'r' }
  }

  async deleteSubResource() {
    return undefined
  }
}

describe('BaseService', () => {
  test('ServiceRegistry.get returns registered service', () => {
    const service = new MockService()
    ServiceRegistry.register(service)
    expect(ServiceRegistry.get('mock')).toBe(service)
  })
})
