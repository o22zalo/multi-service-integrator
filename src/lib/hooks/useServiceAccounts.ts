// Path: /src/lib/hooks/useServiceAccounts.ts
// Module: useServiceAccounts
// Depends on: react, @/lib/db/LocalDb, @/types/service, ./index
// Description: Fetches service account lists with local cache hydration.

'use client'

import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/db/LocalDb'
import type { ServiceListItem } from '@/types/service'
import type { UseServiceAccountsReturn } from './index'

/** Loads account summaries for a service type. */
export function useServiceAccounts(serviceType: string): UseServiceAccountsReturn {
  const [accounts, setAccounts] = useState<ServiceListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLocal = useCallback(async () => {
    const cached = await db.services.where('serviceType').equals(serviceType).toArray()
    if (cached.length) {
      setAccounts(
        cached.map((item) => ({
          id: item.id,
          uid: item.uid,
          serviceType: item.serviceType,
          name: item.name,
          status: String(item.meta.status ?? 'active') as ServiceListItem['status'],
          shardId: item.shardId,
          createdAt: String(item.meta.createdAt ?? new Date(item.updatedAt).toISOString()),
          updatedAt: new Date(item.updatedAt).toISOString(),
        })),
      )
    }
  }, [serviceType])

  const refetch = useCallback(() => {
    setIsLoading(true)
    setError(null)
    fetch(`/api/services/${serviceType}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? 'Failed to load accounts')
        return body.data as ServiceListItem[]
      })
      .then(async (items) => {
        setAccounts(items)
        await Promise.all(
          items.map((item) =>
            db.services.put({
              id: item.id,
              uid: item.uid,
              serviceType: item.serviceType,
              name: item.name,
              shardId: item.shardId,
              meta: { status: item.status, createdAt: item.createdAt },
              updatedAt: Date.parse(item.updatedAt),
            }),
          ),
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setIsLoading(false))
  }, [serviceType])

  useEffect(() => {
    loadLocal().finally(refetch)
  }, [loadLocal, refetch])

  const deleteAccount = useCallback(async (id: string) => {
    const res = await fetch(`/api/services/${serviceType}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error?.message ?? 'Delete failed')
    }
    setAccounts((current) => current.filter((item) => item.id !== id))
    await db.services.delete(id)
  }, [serviceType])

  return { accounts, isLoading, error, refetch, deleteAccount }
}
