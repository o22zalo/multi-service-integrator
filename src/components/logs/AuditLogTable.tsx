// Path: /src/components/logs/AuditLogTable.tsx
// Module: AuditLogTable
// Depends on: react, date-fns, ./OperationLogDrawer, ./index
// Description: Audit and operation log table view.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { AuditEntry, OperationLog } from '@/lib/logger'
import { OperationLogDrawer } from './OperationLogDrawer'
import type { AuditLogTableProps } from './index'

/** Renders a filterable audit-log table. */
export function AuditLogTable({ uid, filters }: AuditLogTableProps) {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [operations, setOperations] = useState<OperationLog[]>([])
  const [selectedOperation, setSelectedOperation] = useState<OperationLog | null>(null)

  useEffect(() => {
    const search = new URLSearchParams()
    if (filters.action) search.set('action', filters.action)
    if (filters.result && filters.result !== 'ALL') search.set('result', filters.result)
    fetch(`/api/admin/logs?uid=${uid}&${search.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        setAuditLogs(body.data?.audit ?? [])
        setOperations(body.data?.operations ?? [])
      })
      .catch(() => {
        setAuditLogs([])
        setOperations([])
      })
  }, [filters.action, filters.result, uid])

  const rows = useMemo(() => auditLogs, [auditLogs])

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-slate-300">{format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss')}</td>
                <td className="px-4 py-3 text-slate-300">{row.actor}</td>
                <td className="px-4 py-3 text-white">{row.action}</td>
                <td className="px-4 py-3 text-slate-400">{row.target.type}:{row.target.id}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[11px] ${row.result === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                    {row.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{row.durationMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-white">Recent operations</h3>
        <div className="mt-4 space-y-3">
          {operations.map((op) => (
            <button key={op.id} type="button" onClick={() => setSelectedOperation(op)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-left hover:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{op.action}</p>
                <span className={`rounded-full px-2 py-1 text-[11px] ${op.result === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  {op.result}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{op.timestamp}</p>
            </button>
          ))}
        </div>
      </div>

      <OperationLogDrawer operation={selectedOperation} isOpen={Boolean(selectedOperation)} onClose={() => setSelectedOperation(null)} />
    </div>
  )
}
