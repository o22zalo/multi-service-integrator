// Path: /src/components/layout/Header.tsx
// Module: Header
// Depends on: react, next/link, lucide-react, ./UserMenu, ./NotificationPanel, ./index
// Description: Top application header with breadcrumb, notifications, and user controls.

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { NotificationPanel } from './NotificationPanel'
import type { HeaderProps } from './index'

/** Renders the app header. */
export function Header({ user, breadcrumb = [], onToggleSidebar }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="relative flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onToggleSidebar} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 md:hidden">
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              {breadcrumb.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  {item.href ? <Link href={item.href} className="hover:text-white">{item.label}</Link> : <span>{item.label}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNotifOpen((value) => !value)}
            className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
          </button>
          <UserMenu user={user} />
          <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
      </div>
    </header>
  )
}
