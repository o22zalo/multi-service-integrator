// Path: /src/components/layout/UserMenu.tsx
// Module: UserMenu
// Depends on: react, next-auth/react, ./index
// Description: Small user menu with sign-out action.

'use client'

import { signOut } from 'next-auth/react'
import type { UserMenuProps } from './index'

/** Renders user info and sign-out controls. */
export function UserMenu({ user }: UserMenuProps) {
  const initials = (user.displayName ?? user.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-950 px-2 py-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-400">
        {initials}
      </div>
      <div className="hidden pr-2 sm:block">
        <p className="text-sm font-medium text-white">{user.displayName ?? 'Authenticated User'}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
      >
        Sign out
      </button>
    </div>
  )
}
