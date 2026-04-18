// Path: /src/components/layout/Sidebar.tsx
// Module: Sidebar
// Depends on: next/link, lucide-react, @/lib/utils/icons, ./index
// Description: Left-side service navigation.

'use client'

import Link from 'next/link'
import { LayoutDashboard, Settings } from 'lucide-react'
import { getLucideIcon } from '@/lib/utils/icons'
import type { SidebarProps } from './index'

/** Renders the primary sidebar navigation. */
export function Sidebar({ services, currentPath, isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} hidden border-r border-slate-800 bg-slate-900 transition-all duration-200 md:flex md:flex-col`}>
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        {!isCollapsed && (
          <div>
            <p className="text-sm font-semibold text-white">MSI</p>
            <p className="text-xs text-slate-500">Service control plane</p>
          </div>
        )}
        <button type="button" onClick={onToggle} className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
          {isCollapsed ? '>' : '<'}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <Link href="/dashboard" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${currentPath === '/dashboard' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {services.map((service) => {
          const Icon = getLucideIcon(service.icon)
          const href = `/dashboard/services/${service.type}`
          const active = currentPath.startsWith(href)
          return (
            <Link
              key={service.type}
              href={href}
              title={service.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{service.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Link href="/dashboard/logs" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${currentPath.startsWith('/dashboard/logs') ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
          <Settings className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Logs</span>}
        </Link>
      </div>
    </aside>
  )
}
