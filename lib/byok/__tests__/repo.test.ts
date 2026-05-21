import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteKey,
  getDecryptedKey,
  loadKeyMeta,
  loadRecentAudit,
  setKey,
} from '@/lib/byok/repo'
import { MASTER_KEY_BYTES } from '@/lib/byok/master-key'
import type { SupabaseServerClient } from '@/lib/supabase/server'

const SAMPLE_KEY = 'sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

// One chain per from() call. The chain queues its terminal result up
// front (via `result`); intermediate verbs return the chain for further
// chaining. The terminal verbs (maybeSingle / single / limit) and the
// thenable-resolving last `eq()` in a delete chain resolve to the
// queued result.

type ChainResult = { data: unknown; error: unknown }

interface ChainSpy {
  table: string
  result: ChainResult
  select?: unknown
  upsert?: unknown
  insert?: unknown
  eqArgs: Array<[unknown, unknown]>
  orderArgs: Array<[string, unknown]>
  limitArgs: number[]
  isDelete: boolean
}

interface MockClient {
  client: SupabaseServerClient
  chains: ChainSpy[]
}

function makeClient(queue: ChainResult[]): MockClient {
  const chains: ChainSpy[] = []
  const remaining = [...queue]
  const root = {
    from: vi.fn((table: string) => {
      const chain: ChainSpy = {
        table,
        result: remaining.shift() ?? { data: null, error: null },
        eqArgs: [],
        orderArgs: [],
        limitArgs: [],
        isDelete: false,
      }
      chains.push(chain)
      const thenable: Record<string, unknown> = {
        select(arg: unknown) {
          chain.select = arg
          return thenable
        },
        upsert(payload: unknown, _opts?: unknown) {
          chain.upsert = payload
          return thenable
        },
        insert(payload: unknown) {
          chain.insert = payload
          return Promise.resolve(chain.result)
        },
        delete() {
          chain.isDelete = true
          return thenable
        },
        eq(col: unknown, val: unknown) {
          chain.eqArgs.push([col, val])
          return thenable
        },
        order(col: string, opts?: unknown) {
          chain.orderArgs.push([col, opts])
          return thenable
        },
        limit(n: number) {
          chain.limitArgs.push(n)
          return Promise.resolve(chain.result)
        },
        maybeSingle() {
          return Promise.resolve(chain.result)
        },
        single() {
          return Promise.resolve(chain.result)
        },
        // Allows `await supabase.from(...).delete().eq(...)` (no
        // terminal verb) to resolve directly.
        then(
          onFulfilled: (v: ChainResult) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve(chain.result).then(
            onFulfilled,
            onRejected,
          )
        },
      }
      return thenable as never
    }),
  }
  return {
    client: root as unknown as SupabaseServerClient,
    chains,
  }
}

function makeService(): {
  service: never
  insertSpy: ReturnType<typeof vi.fn>
  fromSpy: ReturnType<typeof vi.fn>
} {
  const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null })
  const fromSpy = vi.fn().mockReturnValue({ insert: insertSpy })
  return {
    service: { from: fromSpy } as never,
    insertSpy,
    fromSpy,
  }
}

describe('byok repo', () => {
  const originalEnv = process.env.BYOK_MASTER_KEY

  beforeEach(() => {
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BYOK_MASTER_KEY
    } else {
      process.env.BYOK_MASTER_KEY = originalEnv
    }
  })

  it('loadKeyMeta returns null when no row exists', async () => {
    const { client, chains } = makeClient([{ data: null, error: null }])
    const out = await loadKeyMeta(client, 'user-1')
    expect(out).toBeNull()
    expect(chains[0]!.table).toBe('user_api_keys')
    expect(chains[0]!.select).toBe('mask, key_version, updated_at')
    expect(chains[0]!.eqArgs[0]).toEqual(['user_id', 'user-1'])
  })

  it('loadKeyMeta maps the row when one exists', async () => {
    const { client } = makeClient([
      {
        data: {
          mask: 'sk-ant…XYZW',
          key_version: 1,
          updated_at: '2026-05-20T00:00:00Z',
        },
        error: null,
      },
    ])
    expect(await loadKeyMeta(client, 'user-1')).toEqual({
      mask: 'sk-ant…XYZW',
      keyVersion: 1,
      updatedAt: '2026-05-20T00:00:00Z',
    })
  })

  it('loadKeyMeta throws when supabase returns an error', async () => {
    const { client } = makeClient([
      { data: null, error: { message: 'boom' } },
    ])
    await expect(loadKeyMeta(client, 'user-1')).rejects.toThrow(/boom/)
  })

  it('setKey writes an `add` audit row when no prior key exists', async () => {
    const { client, chains } = makeClient([
      { data: null, error: null },
      {
        data: {
          mask: 'sk-ant…XYZW',
          key_version: 1,
          updated_at: '2026-05-20T00:00:00Z',
        },
        error: null,
      },
    ])
    const { service, fromSpy, insertSpy } = makeService()
    const out = await setKey(client, 'user-1', SAMPLE_KEY, () => service)
    expect(out.mask).toMatch(/^sk-ant.+/)
    expect(chains[0]!.table).toBe('user_api_keys')
    expect(chains[1]!.upsert).toBeTruthy()
    expect(fromSpy).toHaveBeenCalledWith('user_api_key_audit')
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        event: 'add',
        key_version: 1,
      }),
    )
  })

  it('setKey writes a `rotate` audit row when a prior key exists', async () => {
    const { client } = makeClient([
      { data: { user_id: 'user-1' }, error: null },
      {
        data: {
          mask: 'sk-ant…NEWW',
          key_version: 1,
          updated_at: '2026-05-20T00:00:00Z',
        },
        error: null,
      },
    ])
    const { service, insertSpy } = makeService()
    await setKey(client, 'user-1', SAMPLE_KEY, () => service)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'rotate' }),
    )
  })

  it('deleteKey writes a `revoke` audit row and deletes the row', async () => {
    const { client, chains } = makeClient([
      { data: { key_version: 1 }, error: null },
      { data: null, error: null },
    ])
    const { service, insertSpy } = makeService()
    await deleteKey(client, 'user-1', () => service)
    expect(chains[1]!.isDelete).toBe(true)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'revoke', key_version: 1 }),
    )
  })

  it('deleteKey is idempotent when no row exists (no audit row)', async () => {
    const { client } = makeClient([{ data: null, error: null }])
    const { service, fromSpy } = makeService()
    await deleteKey(client, 'user-1', () => service)
    expect(fromSpy).not.toHaveBeenCalled()
  })

  it('getDecryptedKey returns null when no row exists', async () => {
    const { client } = makeClient([{ data: null, error: null }])
    expect(await getDecryptedKey(client, 'user-1')).toBeNull()
  })

  it('loadRecentAudit returns the most recent events', async () => {
    const rows = [
      {
        id: 2,
        event: 'rotate',
        key_version: 1,
        created_at: '2026-05-20T01:00:00Z',
      },
      {
        id: 1,
        event: 'add',
        key_version: 1,
        created_at: '2026-05-19T12:00:00Z',
      },
    ]
    const { client, chains } = makeClient([{ data: rows, error: null }])
    const out = await loadRecentAudit(client, 'user-1', 5)
    expect(chains[0]!.orderArgs[0]).toEqual([
      'created_at',
      { ascending: false },
    ])
    expect(chains[0]!.limitArgs[0]).toBe(5)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      id: 2,
      event: 'rotate',
      keyVersion: 1,
      createdAt: '2026-05-20T01:00:00Z',
    })
  })
})
