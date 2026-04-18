// Path: /src/app/(dashboard)/layout.tsx
// Module: DashboardLayout
// Depends on: next/navigation, @/lib/auth/auth, @/components/layout/AppShell, @/lib/store/AppStore
// Description: Protects dashboard routes and renders the application shell.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardSessionBridge } from '@/components/providers/DashboardSessionBridge'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.uid) {
    redirect('/login')
  }

  return (
    <DashboardSessionBridge sessionUser={session.user}>
      <AppShell>{children}</AppShell>
    </DashboardSessionBridge>
  )
}
