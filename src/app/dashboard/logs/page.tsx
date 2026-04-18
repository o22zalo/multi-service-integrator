// Path: /src/app/dashboard/logs/page.tsx
// Module: LogsPage
// Depends on: @/components/logs/AuditLogTable, @/lib/auth/auth
// Description: Protected log exploration page.

import { auth } from '@/lib/auth/auth'
import { AuditLogTable } from '@/components/logs/AuditLogTable'

export default async function LogsPage() {
  const session = await auth()
  if (!session?.user?.uid) return null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-sky-400">Observability</p>
        <h1 className="text-3xl font-semibold text-white">Audit and operation logs</h1>
      </div>
      <AuditLogTable uid={session.user.uid} filters={{ result: 'ALL' }} />
    </div>
  )
}
