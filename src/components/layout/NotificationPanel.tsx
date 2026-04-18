// Path: /src/components/layout/NotificationPanel.tsx
// Module: NotificationPanel
// Depends on: react, date-fns, @/lib/logger/OperationLogger, ./index
// Description: Displays recent operation logs in a flyout panel.

'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { OperationLogger } from '@/lib/logger/OperationLogger'
import type { OperationLog } from '@/lib/logger'
import type { NotificationPanelProps } from './index'

/** Renders the notification flyout backed by recent operation logs. */
export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [items, setItems] = useState<OperationLog[]>([])

  useEffect(() => {
    if (!isOpen) return
    OperationLogger.getInstance().getRecentOps(10).then(setItems).catch(() => setItems([]))
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-14 z-50 w-[360px] rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Recent operations</h3>
        <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-white">Close</button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-500">No recent operations.</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.action}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.result === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                {item.result}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
            {item.error && <p className="mt-2 text-xs text-rose-300">{item.error}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
