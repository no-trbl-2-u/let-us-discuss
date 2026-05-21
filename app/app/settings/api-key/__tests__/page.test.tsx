import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadKeyMeta = vi.fn()
const loadRecentAudit = vi.fn()
const requireUser = vi.fn()

vi.mock('@/lib/supabase/auth', () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/byok/repo', async () => {
  const actual = await vi.importActual<typeof import('@/lib/byok/repo')>(
    '@/lib/byok/repo',
  )
  return {
    ...actual,
    loadKeyMeta: (...args: unknown[]) => loadKeyMeta(...args),
    loadRecentAudit: (...args: unknown[]) => loadRecentAudit(...args),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import ApiKeyPage from '@/app/app/settings/api-key/page'

describe('/app/settings/api-key page', () => {
  const originalEnv = process.env.BYOK_MASTER_KEY

  beforeEach(() => {
    requireUser.mockResolvedValue({ id: 'user-1', email: 'a@b.co' })
    loadKeyMeta.mockReset()
    loadRecentAudit.mockReset()
    loadKeyMeta.mockResolvedValue(null)
    loadRecentAudit.mockResolvedValue([])
    process.env.BYOK_MASTER_KEY = Buffer.alloc(32, 0xab).toString('base64')
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BYOK_MASTER_KEY
    } else {
      process.env.BYOK_MASTER_KEY = originalEnv
    }
  })

  it('renders the breadcrumb + heading + paste form when no key exists', async () => {
    const Component = await ApiKeyPage()
    render(Component)
    expect(
      screen.getByRole('heading', { level: 1, name: /api key/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument()
  })

  it('renders the masked summary + audit log when a key exists', async () => {
    loadKeyMeta.mockResolvedValue({
      mask: 'sk-ant…XYZW',
      keyVersion: 1,
      updatedAt: '2026-05-20T14:33:00Z',
    })
    loadRecentAudit.mockResolvedValue([
      {
        id: 1,
        event: 'add',
        keyVersion: 1,
        createdAt: '2026-05-19T12:00:00Z',
      },
    ])
    const Component = await ApiKeyPage()
    render(Component)
    expect(screen.getByText('sk-ant…XYZW')).toBeInTheDocument()
    expect(screen.getByText(/add\s+2026-05-19/)).toBeInTheDocument()
  })

  it('renders the disabled panel when BYOK_MASTER_KEY is unset', async () => {
    delete process.env.BYOK_MASTER_KEY
    const Component = await ApiKeyPage()
    render(Component)
    expect(
      screen.getByText(/byok is not enabled on this deployment/i),
    ).toBeInTheDocument()
    expect(loadKeyMeta).not.toHaveBeenCalled()
  })

  it('renders gracefully when the underlying table does not exist yet', async () => {
    loadKeyMeta.mockRejectedValue(new Error('relation does not exist'))
    loadRecentAudit.mockRejectedValue(new Error('relation does not exist'))
    const Component = await ApiKeyPage()
    render(Component)
    // No key on file; paste form shows.
    expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument()
  })
})
