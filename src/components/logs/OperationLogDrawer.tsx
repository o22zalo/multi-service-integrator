// Path: /src/components/logs/OperationLogDrawer.tsx
// Module: OperationLogDrawer
// Depends on: react, ./ApiCallDetail, ./index
// Description: Slide-over drawer for a selected operation log.

'use client'

import { ApiCallDetail } from './ApiCallDetail'
import type { OperationLogDrawerProps } from './index'

/** Renders a slide-over detail drawer for one operation log. */
export function OperationLogDrawer({ operation, isOpen, onClose, onReplay }: OperationLogDrawerProps) {
  if (!isOpen || !operation) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="h-full w-full max-w-xl overflow-auto border-l border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Operation detail</h3>
            <p className="mt-1 text-sm text-slate-400">{operation.timestamp}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">Close</button>
        </div>
        <div className="mt-6">
          <ApiCallDetail operation={operation} />
        </div>
        {onReplay && (
          <button type="button" onClick={() => onReplay(operation)} className="mt-6 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400">
            Replay
          </button>
        )}
      </div>
    </div>
  )
}
