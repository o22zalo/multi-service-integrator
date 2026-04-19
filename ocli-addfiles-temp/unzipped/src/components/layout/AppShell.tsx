// Path: /src/components/layout/AppShell.tsx
// Module: AppShell
// Depends on: react, next/navigation, ./Sidebar, ./Header, @/services/_registry/serviceMeta,
//             @/lib/store/AppStore, @/lib/hooks/usePrefetch
// Description: Application shell với background prefetch khi mount để warmup cache.

'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SERVICE_META } from '@/services/_registry/serviceMeta'
import { useAppStore } from '@/lib/store/AppStore'
import { usePrefetchServices } from '@/lib/hooks/usePrefetch'

function buildBreadcrumb(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const breadcrumb: Array<{ label: string; href?: string }> = [{ label: 'Dashboard', href: '/dashboard' }]
  let acc = ''
  for (const part of parts.slice(1)) {
    acc += `/${part}`
    breadcrumb.push({
      label: part.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      href: `/dashboard${acc}`,
    })
  }
  return breadcrumb
}

/** Renders the dashboard shell. Warms up all service caches in the background on mount. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { currentUser } = useAppStore()
  const breadcrumb = useMemo(() => buildBreadcrumb(pathname), [pathname])

  // Background prefetch — chạy sau 800ms khi shell mount lần đầu.
  // Kết quả vào ClientCache → user navigate vào service page thấy data ngay.
  usePrefetchServices()

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        services={SERVICE_META}
        currentPath={pathname}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={{
            email: currentUser?.email ?? 'unknown@example.com',
            displayName: currentUser?.displayName,
          }}
          breadcrumb={breadcrumb}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
