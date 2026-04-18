// Path: /src/services/_registry/ServiceRegistry.ts
// Module: ServiceRegistry
// Depends on: ../_base/BaseService, ./serviceMeta
// Description: Server-side registry for service implementations.

import type { BaseService } from '../_base/BaseService'
import type { ServiceMeta } from './serviceMeta'

type AnyService = BaseService<any, any, any>

class ServiceRegistryImpl {
  private readonly registry = new Map<string, AnyService>()

  /** Registers a service implementation. */
  register(service: AnyService): void {
    this.registry.set(service.SERVICE_TYPE, service)
  }

  /** Returns a service implementation by type. */
  get(type: string): AnyService {
    const service = this.registry.get(type)
    if (!service) {
      throw new Error(`Service '${type}' not registered`)
    }
    return service
  }

  /** Lists metadata for all registered services. */
  list(): ServiceMeta[] {
    return Array.from(this.registry.values()).map((service) => ({
      type: service.SERVICE_TYPE,
      label: service.SERVICE_LABEL,
      icon: service.ICON,
      description: service.DESCRIPTION,
    }))
  }

  /** Returns true when a service is registered. */
  has(type: string): boolean {
    return this.registry.has(type)
  }
}

export const ServiceRegistry = new ServiceRegistryImpl()
