// Path: /src/components/services/_shared/AccountCard.tsx
// Module: AccountCard
// Depends on: date-fns, lucide-react, @/services/_registry/serviceMeta, ./index
// Description: Summary card for one service account.

'use client'

import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Trash2 } from 'lucide-react'
import { getServiceMeta } from '@/services/_registry/serviceMeta'
import { getLucideIcon } from '@/lib/utils/icons'
import type { AccountCardProps } from './index'

/** Renders a service account summary card. */
export function AccountCard({ item, onDelete }: AccountCardProps) {
  const meta = getServiceMeta(item.serviceType)
  const Icon = getLucideIcon(meta?.icon ?? 'box')

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{meta?.label ?? item.serviceType}</p>
            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
          {item.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-400">
        {item.email ? <p>Email: <span className="text-slate-300">{item.email}</span></p> : null}
        <p>Shard: <span className="text-slate-300">{item.shardId}</span></p>
        <p>Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</p>
      </div>

      <div className="mt-5 flex gap-3">
        <a href={`/dashboard/services/${item.serviceType}/${item.id}`} className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-400">
          <ExternalLink className="h-4 w-4" />
          Open
        </a>
        <button type="button" onClick={() => onDelete(item.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  )
}
