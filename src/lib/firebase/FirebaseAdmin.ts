// Path: /src/lib/firebase/FirebaseAdmin.ts
// Module: Firebase Admin Initialization
// Depends on: firebase-admin, firebase-admin/app, firebase-admin/database, ./index
// Description: Initializes and caches firebase-admin apps for each RTDB shard.

import * as admin from 'firebase-admin'
import type { App } from 'firebase-admin/app'
import type { Database } from 'firebase-admin/database'
import type { ShardConfig } from './index'

const apps: Map<string, App> = new Map()

/** Returns the firebase-admin app instance for a shard. */
export function getAdminApp(shardId: string): App {
  const app = apps.get(shardId)
  if (!app) {
    throw new Error(`DB-SHARD-002: Shard ${shardId} not initialized`)
  }
  return app
}

/** Returns the admin RTDB database instance for a shard. */
export function getAdminDb(shardId: string): Database {
  const app = getAdminApp(shardId)
  return admin.database(app)
}

/** Initializes an admin app for a specific shard config and caches it. */
export function initializeAdminApp(config: ShardConfig): App {
  const existing = apps.get(config.id)
  if (existing) return existing

  const decoded = Buffer.from(config.serviceAccountBase64, 'base64').toString('utf8')
  const serviceAccount = JSON.parse(decoded)

  const app = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: config.databaseUrl,
      projectId: config.projectId,
    },
    config.id,
  )

  apps.set(config.id, app)
  return app
}
