// Path: /src/components/logs/ApiCallDetail.tsx
// Module: ApiCallDetail
// Depends on: @/lib/logger, @/lib/utils/api
// Description: Displays operation log details.

import type { OperationLog } from '@/lib/logger'
import { maskSecret } from '@/lib/utils/api'

/** Renders detailed operation log information. */
export function ApiCallDetail({ operation }: { operation: OperationLog }) {
  const headers = { ...(operation.requestHeaders ?? {}) }
  if (headers.Authorization) headers.Authorization = maskSecret(headers.Authorization)

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Action</p>
        <p className="mt-1 text-white">{operation.action}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Request headers</p>
        <pre className="code-block mt-1">{JSON.stringify(headers, null, 2)}</pre>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Response excerpt</p>
        <pre className="code-block mt-1">{operation.responseBody ?? 'No response body recorded.'}</pre>
      </div>
    </div>
  )
}
