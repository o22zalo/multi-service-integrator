// Path: /src/components/providers/DashboardSessionBridge.tsx
// Module: DashboardSessionBridge
// Depends on: react, @/lib/store/AppStore
// Description: Syncs server session user into the client app store.

'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store/AppStore'

/** Pushes the authenticated session user into the Zustand app store. */
export function DashboardSessionBridge({ children, sessionUser }: { children: React.ReactNode; sessionUser: { uid: string; email: string; displayName?: string; role: 'owner' | 'admin' | 'viewer' } }) {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser)

  useEffect(() => {
    setCurrentUser(sessionUser)
  }, [sessionUser, setCurrentUser])

  return <>{children}</>
}
