// Path: /src/lib/hooks/useSubResources.ts
// Module: useSubResources
// Depends on: react, ./index
// Description: Fetches and mutates service sub-resources.

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { UseSubResourcesReturn } from './index'

/** Loads and mutates sub-resources for a service account. */
export function useSubResources(serviceType: string, accountId: string, subType: string, params: Record<string, string> = {}): UseSubResourcesReturn {
  const [resources, setResources] = useState<unknown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const search = new URLSearchParams(params).toString()
  const baseUrl = `/api/services/${serviceType}/${accountId}/sub/${subType}${search ? `?${search}` : ''}`

  const refetch = useCallback(() => {
    setIsLoading(true)
    setError(null)
    fetch(baseUrl)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? 'Failed to load resources')
        return body.data as unknown[]
      })
      .then(setResources)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setIsLoading(false))
  }, [baseUrl])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createResource = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error?.message ?? 'Create failed')
    if (body.data?.resource) {
      setResources((current) => [body.data.resource, ...current])
    }
    return body.data
  }, [baseUrl])

  const deleteResource = useCallback(async (id: string, extra: Record<string, unknown> = {}) => {
    const searchParams = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
      ...Object.fromEntries(Object.entries(extra).map(([key, value]) => [key, String(value)])),
    })
    const res = await fetch(`/api/services/${serviceType}/${accountId}/sub/${subType}/${id}?${searchParams.toString()}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error?.message ?? 'Delete failed')
    }
    setResources((current) => current.filter((item) => String((item as { id?: string }).id ?? '') !== id))
  }, [accountId, params, serviceType, subType])

  return { resources, isLoading, error, refetch, createResource, deleteResource }
}
