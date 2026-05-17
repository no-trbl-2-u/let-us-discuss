import {
  _resetForTests,
  deliverAnswer,
  failResume,
  waitForAnswer,
} from '@/lib/sessions/resume-map'
import { beforeEach, describe, expect, it } from 'vitest'

describe('resume-map', () => {
  beforeEach(() => {
    _resetForTests()
  })

  it('returns false when delivering to an unknown session', () => {
    expect(deliverAnswer('nope', { kind: 'clarify', body: 'x' })).toBe(false)
  })

  it('delivers to a waiting promise', async () => {
    const waiter = waitForAnswer('sid')
    expect(deliverAnswer('sid', { kind: 'clarify', body: 'hi' })).toBe(true)
    const result = await waiter
    expect(result).toEqual({ kind: 'clarify', body: 'hi' })
  })

  it('only resolves once per registration', async () => {
    const waiter = waitForAnswer('sid')
    expect(deliverAnswer('sid', { kind: 'clarify', body: 'first' })).toBe(true)
    expect(deliverAnswer('sid', { kind: 'clarify', body: 'second' })).toBe(
      false,
    )
    await expect(waiter).resolves.toEqual({ kind: 'clarify', body: 'first' })
  })

  it('supersedes a previous waiter when a new one registers', async () => {
    const first = waitForAnswer('sid')
    const second = waitForAnswer('sid')
    expect(deliverAnswer('sid', { kind: 'clarify', body: 'late' })).toBe(true)
    await expect(first).rejects.toThrow(/superseded/)
    await expect(second).resolves.toEqual({ kind: 'clarify', body: 'late' })
  })

  it('failResume rejects an outstanding waiter', async () => {
    const waiter = waitForAnswer('sid')
    expect(failResume('sid', new Error('cancelled'))).toBe(true)
    await expect(waiter).rejects.toThrow(/cancelled/)
  })
})
