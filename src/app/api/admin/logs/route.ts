// Path: /src/app/api/admin/logs/route.ts
// Module: Admin Logs Route
// Depends on: @/lib/auth/withAuth, @/lib/logger/AuditLogger, @/lib/firebase/FirebaseAdmin, @/lib/firebase/ShardManager
// Description: Returns audit and operation logs for the authenticated user.

import { withAuth } from '@/lib/auth/withAuth'
import { AuditLogger } from '@/lib/logger/AuditLogger'
import { getAdminDb } from '@/lib/firebase/FirebaseAdmin'
import { ShardManager } from '@/lib/firebase/ShardManager'
import { ok } from '@/lib/utils/api'
import type { OperationLog } from '@/lib/logger'

export const GET = withAuth(async (req, { user }) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') ?? undefined
  const result = url.searchParams.get('result') as 'SUCCESS' | 'FAILURE' | null
  const audit = await AuditLogger.getInstance().getLogs(user.uid, {
    action: action as any,
    result: result ?? undefined,
    limit: 100,
  })

  const shardId = ShardManager.getInstance().getWriteShard().id
  const operationsSnap = await getAdminDb(shardId).ref('/operation_logs').get()
  const operations = Object.values((operationsSnap.val() ?? {}) as Record<string, OperationLog>)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 50)

  return ok({ audit, operations })
}, { role: 'owner' })
