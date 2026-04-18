// Path: /src/lib/hooks/index.ts
// Module: Hook Types
// Depends on: @/types/service, @/lib/db/index
// Description: Shared custom hook return types.

import type { LocalServiceDetail } from '@/lib/db'
import type { ServiceListItem } from '@/types/service'

export interface UseServiceAccountsReturn {
  accounts: ServiceListItem[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  deleteAccount: (id: string) => Promise<void>
}

export interface UseSubResourcesReturn<T = unknown> {
  resources: T[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  createResource: (data: Record<string, unknown>) => Promise<{ resource?: T; missing_fields?: string[]; defaults?: Record<string, unknown> }>
  deleteResource: (id: string, extra?: Record<string, unknown>) => Promise<void>
}

export interface UseServiceListReturn {
  ids: string[]
  isLoading: boolean
  error: string | null
  cursor: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
}

export interface UseServiceDetailReturn {
  detail: LocalServiceDetail | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseInfiniteListOptions<T> {
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>
  pageSize?: number
}

export interface UseInfiniteListReturn<T> {
  items: T[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  loadMore: () => void
  error: string | null
}
