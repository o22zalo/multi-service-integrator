// Path: /src/lib/hooks/useInfiniteList.ts
// Module: useInfiniteList
// Depends on: react, ./index
// Description: Simple infinite list hook using cursor-based fetching.

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { UseInfiniteListOptions, UseInfiniteListReturn } from './index'

/** Handles cursor-based list expansion. */
export function useInfiniteList<T>(options: UseInfiniteListOptions<T>): UseInfiniteListReturn<T> {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (nextCursor: string | null, mode: 'replace' | 'append' = 'replace') => {
    try {
      const page = await options.fetchPage(nextCursor)
      setItems((current) => (mode === 'replace' ? page.items : [...current, ...page.items]))
      setCursor(page.nextCursor)
      setHasMore(Boolean(page.nextCursor))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [options])

  useEffect(() => {
    load(null, 'replace')
  }, [load])

  const loadMore = useCallback(() => {
    if (!cursor || isFetchingMore) return
    setIsFetchingMore(true)
    load(cursor, 'append')
  }, [cursor, isFetchingMore, load])

  return { items, isLoading, isFetchingMore, hasMore, loadMore, error }
}
