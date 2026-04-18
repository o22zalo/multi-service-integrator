// Path: /src/lib/store/ServiceStore.ts
// Module: ServiceStore (Zustand)
// Depends on: zustand, ../db/LocalDb, ../db/SyncManager, ../firebase/ShardManager, ./index
// Description: Per-service state management with local-first detail loading.

import { create } from 'zustand'
import { db } from '../db/LocalDb'
import { SyncManager } from '../db/SyncManager'
import { ShardManager } from '../firebase/ShardManager'
import type { ServiceState } from './index'

const initialState = {
  serviceIds: [] as string[],
  selectedServiceId: null as string | null,
  serviceDetails: new Map(),
  isLoadingIds: false,
  isLoadingDetail: {} as Record<string, boolean>,
}

export const useServiceStore = create<ServiceState>()((set, get) => ({
  ...initialState,

  loadServiceIds: async (uid: string, serviceType: string) => {
    set({ isLoadingIds: true })

    const localRows = await db.services.where({ uid, serviceType }).toArray()
    if (localRows.length > 0) {
      set({
        serviceIds: localRows.map((row) => row.id),
        isLoadingIds: false,
      })
    }

    try {
      const remoteIds = await ShardManager.getInstance().list(uid, serviceType)
      const nextIds = remoteIds.map((item) => item.id)

      await Promise.all(
        remoteIds.map(async (item) => {
          const existing = await db.services.get(item.id)
          await db.services.put({
            id: item.id,
            uid,
            serviceType,
            name: existing?.name ?? item.id,
            shardId: item.shardId,
            meta: existing?.meta ?? {},
            updatedAt: Date.now(),
          })
        }),
      )

      set({ serviceIds: nextIds, isLoadingIds: false })
    } catch {
      set({ isLoadingIds: false })
    }
  },

  loadServiceDetail: async (id: string) => {
    if (get().serviceDetails.has(id)) return

    set({
      isLoadingDetail: {
        ...get().isLoadingDetail,
        [id]: true,
      },
    })

    const cached = await db.service_details.get(id)
    if (cached) {
      const map = new Map(get().serviceDetails)
      map.set(id, cached)
      set({
        serviceDetails: map,
        isLoadingDetail: { ...get().isLoadingDetail, [id]: false },
      })
      return
    }

    const service = await db.services.get(id)
    if (!service) {
      set({ isLoadingDetail: { ...get().isLoadingDetail, [id]: false } })
      return
    }

    try {
      const remote = await ShardManager.getInstance().read<Record<string, unknown>>(
        service.uid,
        service.serviceType,
        id,
      )
      const detail = {
        id,
        serviceId: id,
        data: remote.data,
        updatedAt: Date.now(),
      }
      await db.service_details.put(detail)
      const map = new Map(get().serviceDetails)
      map.set(id, detail)
      set({
        serviceDetails: map,
        isLoadingDetail: { ...get().isLoadingDetail, [id]: false },
      })
    } catch {
      set({ isLoadingDetail: { ...get().isLoadingDetail, [id]: false } })
    }
  },

  updateService: (id, data) => {
    const existing = get().serviceDetails.get(id)
    if (!existing) return

    const next = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    }

    const map = new Map(get().serviceDetails)
    map.set(id, next)
    set({ serviceDetails: map })

    void db.service_details.put(next)
    void SyncManager.getInstance().markDirty(id, `/local_cache/service_details/${id}`, next, 'update')
  },

  selectService: (id) => {
    set({ selectedServiceId: id })
    if (id && !get().serviceDetails.has(id)) {
      void get().loadServiceDetail(id)
    }
  },

  reset: () => {
    set({
      serviceIds: [],
      selectedServiceId: null,
      serviceDetails: new Map(),
      isLoadingIds: false,
      isLoadingDetail: {},
    })
  },
}))
