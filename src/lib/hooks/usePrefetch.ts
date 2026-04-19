// Path: /src/lib/hooks/usePrefetch.ts
// Module: usePrefetch
// Depends on: react, @/services/_registry/serviceMeta, @/lib/cache/ClientCache
// Description: Warmup hook — prefetch tất cả service lists khi AppShell mount.
// Chạy silently ở background, không block UI, không throw khi lỗi.
// Kết quả được lưu vào ClientCache nên khi user navigate vào service page
// sẽ thấy data ngay lập tức (hoặc chỉ đợi rất ngắn revalidation).

'use client'

import { useEffect } from 'react'
import { SERVICE_META } from '@/services/_registry/serviceMeta'
import { ClientCache } from '@/lib/cache/ClientCache'

const PREFETCH_DELAY_MS = 800  // Đợi UI render xong trước khi prefetch
const STALE_MS = 15_000
const EXPIRE_MS = 60_000

async function prefetchServiceList(serviceType: string): Promise<void> {
  const key = ClientCache.serviceListKey(serviceType)
  ClientCache.prefetch(
    key,
    async () => {
      const res = await fetch(`/api/services/${serviceType}`)
      if (!res.ok) throw new Error(`Prefetch failed for ${serviceType}`)
      const body = await res.json()
      return body.data ?? []
    },
    STALE_MS,
    EXPIRE_MS,
  )
}

/**
 * Warms up service list cache khi component mount.
 * Prefetch theo thứ tự tuần tự với small delay giữa các requests
 * để tránh spike RTDB reads cùng lúc.
 */
export function usePrefetchServices(): void {
  useEffect(() => {
    let cancelled = false
    const serviceTypes = SERVICE_META.map((s) => s.type)

    async function runPrefetch() {
      // Delay nhỏ để không compete với critical render path
      await new Promise((resolve) => setTimeout(resolve, PREFETCH_DELAY_MS))
      if (cancelled) return

      // Prefetch từng service type với stagger nhỏ
      for (const type of serviceTypes) {
        if (cancelled) break
        prefetchServiceList(type)
        // Stagger 200ms giữa mỗi service → tránh thundering herd
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    runPrefetch().catch(() => undefined)
    return () => { cancelled = true }
  }, []) // Chỉ chạy 1 lần khi mount
}

/**
 * Prefetch một service type cụ thể (dùng cho hover trên sidebar link).
 * Gọi ngay, không có delay.
 */
export function prefetchServiceOnHover(serviceType: string): void {
  prefetchServiceList(serviceType).catch(() => undefined)
}
