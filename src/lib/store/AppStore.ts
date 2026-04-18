// Path: /src/lib/store/AppStore.ts
// Module: AppStore (Zustand)
// Depends on: zustand, zustand/middleware, nanoid, ./index
// Description: Global app state for user session, loading flags, and notifications.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { AppState } from './index'

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: false,
      notifications: [],

      setCurrentUser: (user) => {
        set({ currentUser: user })
      },

      addNotification: (notification) => {
        const id = nanoid(10)
        set({
          notifications: [...get().notifications, { ...notification, id }],
        })

        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration)
        }
      },

      removeNotification: (id) => {
        set({
          notifications: get().notifications.filter((notification) => notification.id !== id),
        })
      },

      setLoading: (value) => {
        set({ isLoading: value })
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ currentUser: state.currentUser }),
    },
  ),
)
