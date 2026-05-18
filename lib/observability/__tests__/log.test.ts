import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { logError } from '@/lib/observability/log'

describe('logError', () => {
  let writes: string[]
  let originalWrite: typeof process.stdout.write

  beforeEach(() => {
    writes = []
    originalWrite = process.stdout.write.bind(process.stdout)
    process.stdout.write = ((chunk: unknown) => {
      writes.push(
        typeof chunk === 'string' ? chunk : String(chunk),
      )
      return true
    }) as typeof process.stdout.write
  })

  afterEach(() => {
    process.stdout.write = originalWrite
  })

  it('is quiet under NODE_ENV=test by default', () => {
    logError('orchestrator', new Error('boom'))
    expect(writes).toEqual([])
  })

  it('writes a single JSON line when forced', () => {
    logError('orchestrator', new Error('boom'), undefined, { force: true })
    expect(writes).toHaveLength(1)
    const written = writes[0] ?? ''
    expect(written.endsWith('\n')).toBe(true)
    const trimmed = written.trimEnd()
    expect(trimmed.split('\n').length).toBe(1)
  })

  it('emits the documented JSON shape', () => {
    logError(
      'moderation',
      new Error('boom'),
      { sessionId: 'abc', surface: 'input' },
      { force: true },
    )
    const written = writes[0] ?? ''
    const parsed = JSON.parse(written)
    expect(parsed.level).toBe('error')
    expect(parsed.scope).toBe('moderation')
    expect(parsed.message).toBe('boom')
    expect(parsed.context).toEqual({ sessionId: 'abc', surface: 'input' })
    expect(typeof parsed.ts).toBe('string')
    expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('stringifies non-Error throwables', () => {
    logError('other', 'string-thrown-value', undefined, { force: true })
    const parsed = JSON.parse(writes[0] ?? '')
    expect(parsed.message).toBe('string-thrown-value')
    expect(parsed.stack).toBeUndefined()
  })

  it('omits context when none is provided', () => {
    logError('auth', new Error('x'), undefined, { force: true })
    const parsed = JSON.parse(writes[0] ?? '')
    expect(parsed.context).toBeUndefined()
  })
})
