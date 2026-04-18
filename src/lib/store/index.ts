// Path: /src/lib/store/index.ts
// Module: Store Types
// Depends on: ../db/index
// Description: Shared Zustand store interfaces.

import type { LocalServiceDetail } from '../db'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export interface AppState {
  currentUser: { uid: string; email: string; displayName?: string; role: string } | null
  isLoading: boolean
  notifications: Notification[]
  setCurrentUser: (user: AppState['currentUser']) => void
  addNotification: (n: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setLoading: (v: boolean) => void
}

export interface ServiceState {
  serviceIds: string[]
  selectedServiceId: string | null
  serviceDetails: Map<string, LocalServiceDetail>
  isLoadingIds: boolean
  isLoadingDetail: Record<string, boolean>
  loadServiceIds: (uid: string, serviceType: string) => Promise<void>
  loadServiceDetail: (id: string) => Promise<void>
  updateService: (id: string, data: Partial<LocalServiceDetail>) => void
  selectService: (id: string | null) => void
  reset: () => void
}
