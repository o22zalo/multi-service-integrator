// Path: /src/lib/hooks/useServiceAccounts.ts
// Module: useServiceAccounts
// Depends on: react, @/lib/db/LocalDb, @/types/service, @/lib/cache/ClientCache, ./index
// Description: Fetches service account lists với stale-while-revalidate pattern.
// Cải thiện so với bản cũ:
// - Hiển thị IndexedDB data ngay lập tức (0ms) thay vì chờ fetch
// - SWR: stale 15s, expire 60s → navigation nhanh, ít RTDB call
// - In-flight deduplication qua ClientCache
// - Phân biệt isLoading (lần đầu, chưa có data) vs isRevalidating (đang refresh bg)

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '@/lib/db/LocalDb'
import type { ServiceListItem } from '@/types/service'
import type { UseServiceAccountsReturn } from './index'
import { ClientCache } from '@/lib/cache/ClientCache'

const STALE_MS = 15_000   // 15s fresh — ít API call khi user navigate qua lại
const EXPIRE_MS = 60_000  // 60s max stale

function toLocalItem(item: ServiceListItem) {
  return {
    id: item.id,
    uid: item.uid,
    serviceType: item.serviceType,
    name: item.name,
    shardId: item.shardId,
    meta: { status: item.status, createdAt: item.createdAt },
    updatedAt: Date.parse(item.updatedAt),
  }
}

/** Loads account summaries with instant stale display + background SWR revalidation. */
export function useServiceAccounts(serviceType: string): UseServiceAccountsReturn & { isRevalidating: boolean } {
  const [accounts, setAccounts] = useState<ServiceListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)      // true chỉ khi chưa có data nào
  const [isRevalidating, setIsRevalidating] = useState(false) // true khi đang refresh bg
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchFromApi = useCallback(async (): Promise<ServiceListItem[]> => {
    const cacheKey = ClientCache.serviceListKey(serviceType)
    return ClientCache.get(
      cacheKey,
      async () => {
        const res = await fetch(`/api/services/${serviceType}`)
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? 'Failed to load accounts')
        const items = body.data as ServiceListItem[]
        // Persist vào IndexedDB trong background
        Promise.all(items.map((item) => db.services.put(toLocalItem(item)))).catch(() => undefined)
        return items
      },
      { staleMs: STALE_MS, expireMs: EXPIRE_MS },
    )
  }, [serviceType])

  const load = useCallback(async () => {
    // Step 1: Load từ IndexedDB ngay lập tức
    const cached = await db.services.where('serviceType').equals(serviceType).toArray()

    if (!mountedRef.current) return

    if (cached.length > 0) {
      // Có local data → hiển thị ngay, không còn isLoading
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
      setIsLoading(false)
      // Background revalidate
      setIsRevalidating(true)
      try {
        const fresh = await fetchFromApi()
        if (mountedRef.current) setAccounts(fresh)
      } catch (err) {
        // Silently fail — user vẫn thấy stale data
        if (mountedRef.current) setError(err instanceof Error ? err.message : 'Revalidation failed')
      } finally {
        if (mountedRef.current) setIsRevalidating(false)
      }
    } else {
      // Không có local data → phải chờ API
      setIsLoading(true)
      try {
        const items = await fetchFromApi()
        if (mountedRef.current) {
          setAccounts(items)
          setError(null)
        }
      } catch (err) {
        if (mountedRef.current) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (mountedRef.current) setIsLoading(false)
      }
    }
  }, [serviceType, fetchFromApi])

  useEffect(() => {
    load()
  }, [load])

  const refetch = useCallback(() => {
    // Force invalidate cache rồi load lại
    ClientCache.invalidate(ClientCache.serviceListKey(serviceType))
    load()
  }, [serviceType, load])

  const deleteAccount = useCallback(async (id: string) => {
    const res = await fetch(`/api/services/${serviceType}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error?.message ?? 'Delete failed')
    }
    // Optimistic update — xóa khỏi state ngay
    setAccounts((current) => current.filter((item) => item.id !== id))
    await db.services.delete(id)
    ClientCache.invalidate(ClientCache.serviceListKey(serviceType))
  }, [serviceType])

  return { accounts, isLoading, isRevalidating, error, refetch, deleteAccount }
}
