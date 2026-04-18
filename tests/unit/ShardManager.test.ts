import { ShardManager } from '@/lib/firebase/ShardManager'

describe('ShardManager', () => {
  test('getInstance returns same instance', () => {
    expect(ShardManager.getInstance()).toBe(ShardManager.getInstance())
  })
})
