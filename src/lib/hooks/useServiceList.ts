// Path: /src/lib/hooks/useServiceList.ts
// Module: useServiceList
// Depends on: react, @/lib/db/LocalDb, ./index
// Description: Lightweight IDs-first service list hook.

'use client'

import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/db/LocalDb'
import type { UseServiceListReturn } from './index'

/** Loads cached service IDs then refreshes from the server. */
export function useServiceList(uid: string, serviceType: string): UseServiceListReturn {
  const [ids, setIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const cached = await db.services.where({ uid, serviceType }).toArray()
    if (cached.length) setIds(cached.map((item) => item.id))

    try {
      const response = await fetch(`/api/services/${serviceType}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error?.message ?? 'Failed to load services')
      const nextIds = (body.data as Array<{ id: string }>).map((item) => item.id)
      setIds(nextIds)
      setCursor(body.meta?.cursor ?? null)
      setHasMore(Boolean(body.meta?.cursor))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [serviceType, uid])

  const loadMore = useCallback(async () => {
    if (!cursor) return
    setHasMore(false)
  }, [cursor])

  useEffect(() => {
    load()
  }, [load])

  return { ids, isLoading, error, cursor, hasMore, loadMore }
}
