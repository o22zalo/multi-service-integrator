// Path: /src/lib/hooks/useServiceDetail.ts
// Module: useServiceDetail
// Depends on: react, @/lib/db/LocalDb, ./index
// Description: Fetches an individual service detail with IndexedDB cache.

'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db/LocalDb'
import type { LocalServiceDetail } from '@/lib/db'
import type { UseServiceDetailReturn } from './index'

const CACHE_TTL_MS = 5 * 60 * 1000

/** Loads a cached service detail and refreshes it when stale. */
export function useServiceDetail(id: string | null): UseServiceDetailReturn {
  const [detail, setDetail] = useState<LocalServiceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    const cached = await db.service_details.get(id)
    if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
      setDetail(cached)
      setIsLoading(false)
      return
    }

    try {
      const meta = await db.services.get(id)
      if (!meta) throw new Error('Service metadata not cached yet')
      const response = await fetch(`/api/services/${meta.serviceType}/${id}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error?.message ?? 'Failed to load detail')
      const nextDetail: LocalServiceDetail = {
        id,
        serviceId: id,
        data: body.data,
        updatedAt: Date.now(),
      }
      await db.service_details.put(nextDetail)
      setDetail(nextDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setDetail(null)
      return
    }
    refetch()
  }, [id])

  return { detail, isLoading, error, refetch }
}
