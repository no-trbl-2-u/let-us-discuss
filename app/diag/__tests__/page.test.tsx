import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const notFoundSpy = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next/navigation', () => ({
  notFound: notFoundSpy,
}))

vi.mock('@/lib/supabase/diag', () => ({
  runDiagProbe: vi.fn().mockResolvedValue({
    ok: true,
    value: 1,
    env: { url: 'set', anon: 'set', service: 'set' },
  }),
}))

describe('/diag page', () => {
  const originalEnv = process.env

  beforeEach(() => {
    notFoundSpy.mockClear()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('calls notFound when DIAG_ENABLED is unset', async () => {
    delete process.env.DIAG_ENABLED
    const { default: DiagPage } = await import('@/app/diag/page')
    await expect(DiagPage()).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundSpy).toHaveBeenCalledOnce()
  })

  it('calls notFound when DIAG_ENABLED is any value other than "1"', async () => {
    process.env.DIAG_ENABLED = 'true'
    const { default: DiagPage } = await import('@/app/diag/page')
    await expect(DiagPage()).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders the probe result when DIAG_ENABLED=1', async () => {
    process.env.DIAG_ENABLED = '1'
    const { default: DiagPage } = await import('@/app/diag/page')
    const result = await DiagPage()
    expect(result).toBeDefined()
    expect(notFoundSpy).not.toHaveBeenCalled()
  })
})
