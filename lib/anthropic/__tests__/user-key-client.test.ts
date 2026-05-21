import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const anthropicCtor = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  const Anthropic = vi.fn().mockImplementation((opts: { apiKey: string }) => {
    anthropicCtor(opts)
    return {
      messages: {
        stream: vi.fn(),
      },
    }
  })
  return { default: Anthropic }
})

const getDecryptedKey = vi.fn()
vi.mock('@/lib/byok/repo', async () => {
  const actual = await vi.importActual<typeof import('@/lib/byok/repo')>(
    '@/lib/byok/repo',
  )
  return {
    ...actual,
    getDecryptedKey: (...args: unknown[]) => getDecryptedKey(...args),
  }
})

import {
  BYOK_BANNER_TEXT,
  buildUserKeyStreamClient,
  resolveSessionClient,
} from '@/lib/anthropic/user-key-client'
import { MASTER_KEY_BYTES } from '@/lib/byok/master-key'

const SAMPLE_PLAINTEXT = 'sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

describe('BYOK_BANNER_TEXT', () => {
  it('matches the locked first-line copy', () => {
    expect(BYOK_BANNER_TEXT).toContain("You're paying for this session")
    expect(BYOK_BANNER_TEXT).toContain('Anthropic API key')
  })
})

describe('buildUserKeyStreamClient', () => {
  beforeEach(() => {
    anthropicCtor.mockReset()
  })

  it('passes the apiKey through to the Anthropic SDK constructor', () => {
    const client = buildUserKeyStreamClient(SAMPLE_PLAINTEXT)
    expect(client.streamCompletion).toBeTypeOf('function')
    expect(anthropicCtor).toHaveBeenCalledWith({ apiKey: SAMPLE_PLAINTEXT })
  })
})

describe('resolveSessionClient', () => {
  const originalEnv = process.env.BYOK_MASTER_KEY

  beforeEach(() => {
    anthropicCtor.mockReset()
    getDecryptedKey.mockReset()
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BYOK_MASTER_KEY
    } else {
      process.env.BYOK_MASTER_KEY = originalEnv
    }
  })

  it('returns project when BYOK_MASTER_KEY is unset', async () => {
    delete process.env.BYOK_MASTER_KEY
    const out = await resolveSessionClient({
      supabase: {} as never,
      userId: 'user-1',
    })
    expect(out).toEqual({ client: null, keyOrigin: 'project' })
    expect(getDecryptedKey).not.toHaveBeenCalled()
  })

  it('returns project when the user has no key on file', async () => {
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
    getDecryptedKey.mockResolvedValue(null)
    const out = await resolveSessionClient({
      supabase: {} as never,
      userId: 'user-1',
    })
    expect(out).toEqual({ client: null, keyOrigin: 'project' })
  })

  it('returns project when the stored plaintext is empty/whitespace', async () => {
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
    getDecryptedKey.mockResolvedValue('   ')
    const out = await resolveSessionClient({
      supabase: {} as never,
      userId: 'user-1',
    })
    expect(out.keyOrigin).toBe('project')
    expect(out.client).toBeNull()
  })

  it('returns user when both master + user key are present', async () => {
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
    getDecryptedKey.mockResolvedValue(SAMPLE_PLAINTEXT)
    const out = await resolveSessionClient({
      supabase: {} as never,
      userId: 'user-1',
    })
    expect(out.keyOrigin).toBe('user')
    expect(out.client).not.toBeNull()
    expect(anthropicCtor).toHaveBeenCalledWith({ apiKey: SAMPLE_PLAINTEXT })
  })

  it('swallows getDecryptedKey errors and falls back to project', async () => {
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
    getDecryptedKey.mockRejectedValue(new Error('auth tag mismatch'))
    const out = await resolveSessionClient({
      supabase: {} as never,
      userId: 'user-1',
    })
    expect(out).toEqual({ client: null, keyOrigin: 'project' })
  })
})
