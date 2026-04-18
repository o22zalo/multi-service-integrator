// Path: /src/lib/firebase/FirebaseClient.ts
// Module: Firebase Client Initialization
// Depends on: firebase/app, firebase/database, ./index
// Description: Initializes browser-side firebase client DB instances per shard.

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'
import type { ShardConfig } from './index'

const clientApps: Map<string, FirebaseApp> = new Map()

/** Returns the client RTDB instance for a shard. */
export function getClientDb(shardId: string): Database {
  const app = clientApps.get(shardId)
  if (!app) {
    throw new Error(`DB-SHARD-002: Shard ${shardId} not initialized in client`) 
  }
  return getDatabase(app)
}

/** Initializes and returns a firebase client database for a shard. */
export function initializeClientApp(
  config: Pick<ShardConfig, 'id' | 'projectId' | 'databaseUrl'>,
): Database {
  const cached = clientApps.get(config.id)
  if (cached) return getDatabase(cached)

  const app = getApps().find((candidate) => candidate.name === config.id)
    ?? initializeApp(
      {
        projectId: config.projectId,
        databaseURL: config.databaseUrl,
      },
      config.id,
    )

  clientApps.set(config.id, app)
  return getDatabase(app)
}
