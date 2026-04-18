// Path: /src/lib/firebase/ShardSelector.ts
// Module: ShardSelector
// Depends on: ./index
// Description: Chooses a writable shard using capacity-aware round-robin.

import type { ShardConfig } from './index'

export class ShardSelector {
  private cursor = 0

  /** Selects the best shard for a new write operation. */
  selectShard(shards: ShardConfig[]): ShardConfig {
    const eligible = shards.filter((shard) => (shard.currentLoad / shard.capacity) < 0.9)
    if (eligible.length > 0) {
      return this.weightedRoundRobin(eligible)
    }

    return [...shards].sort((a, b) => a.currentLoad - b.currentLoad)[0]
  }

  /** Performs deterministic round-robin over the eligible shard list. */
  private weightedRoundRobin(available: ShardConfig[]): ShardConfig {
    const index = this.cursor % available.length
    this.cursor = (this.cursor + 1) % Number.MAX_SAFE_INTEGER
    return available[index]
  }
}
