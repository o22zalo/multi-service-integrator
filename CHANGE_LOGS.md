# CHANGE_LOGS.md

## [2026-04-19] — Performance: API Cache + Client SWR + Background Prefetch

### New Files
- `src/lib/cache/ApiCache.ts` — Server-side singleton cache. `ApiCache.get(key, fetcher, ttlMs)` with in-flight Promise deduplication. Prevents duplicate RTDB reads when multiple concurrent requests hit the same route handler within the TTL window. `invalidate(key)` / `invalidatePrefix(prefix)` for post-write cache busting.
- `src/lib/cache/ClientCache.ts` — Browser-side SWR cache. `staleMs` (default 10s) / `expireMs` (default 60s) two-tier freshness. Background revalidation when stale. `subscribe(key, cb)` for cross-component updates. `prefetch(key, fetcher)` for silent warmup.
- `src/lib/hooks/usePrefetch.ts` — `usePrefetchServices()` hook: fires after 800ms AppShell mount, prefetches all `SERVICE_META` service types with 200ms stagger to avoid RTDB read spike. `prefetchServiceOnHover(serviceType)` for sidebar link hover.

### Modified Files
- `src/app/api/services/[type]/route.ts` — `GET` wrapped with `ApiCache.get(serviceListKey, fetcher, 30_000)`. `POST` calls `ApiCache.invalidate()` after write.
- `src/app/api/services/[type]/[id]/route.ts` — `GET` cached 60s. `PUT` / `DELETE` invalidate both list and detail cache keys.
- `src/lib/hooks/useServiceAccounts.ts` — Rewritten with two-phase load: (1) IndexedDB → display immediately if available, (2) `ClientCache.get()` for SWR revalidation in background. Exposes `isRevalidating` flag distinct from `isLoading`. Optimistic delete.
- `src/components/layout/AppShell.tsx` — Calls `usePrefetchServices()`.
- `src/components/layout/Sidebar.tsx` — Adds `onMouseEnter={() => prefetchServiceOnHover(type)}` to each service link.
- `src/components/services/_shared/AccountList.tsx` — Uses `isRevalidating` instead of `isLoading` to show subtle "syncing" badge. Skeleton only shown on true first load (no data at all).

### Performance Impact (estimated)
| Scenario | Before | After |
|---|---|---|
| First visit to service page (cold) | ~600ms blank | ~600ms (no change, must fetch) |
| Navigate away and back (within 15s) | ~600ms skeleton | ~0ms, instant from ClientCache |
| Navigate away and back (15–60s stale) | ~600ms skeleton | ~0ms stale display + bg revalidate |
| Second instance of same service type request | 2× RTDB reads | 1 shared in-flight Promise |
| AppShell → service page (within 1s) | Cold fetch | Cache hit if prefetch completed |
| Hover sidebar link → click | Cold fetch | Often cache hit |

### Architecture Notes
- `ApiCache` is a module-level singleton — lives in Next.js process memory, survives hot reloads in dev. In multi-instance production, each instance has its own cache (acceptable: RTDB is source of truth, cache is optimization layer only).
- `ClientCache` lives in browser tab memory — cleared on page refresh or tab close. This is intentional and consistent with SWR semantics.
- Cache invalidation is conservative: any write (POST/PUT/DELETE) immediately invalidates relevant keys so stale data is never shown after user mutations.
