import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'u-admin', email: 'admin@example.com' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/admin/queries', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/queries')>(
    '@/lib/admin/queries',
  )
  return {
    ...actual,
    loadSessionsPerDay: vi.fn().mockResolvedValue([
      { day: '2026-05-14', sessions: 1 },
      { day: '2026-05-15', sessions: 2 },
      { day: '2026-05-16', sessions: 0 },
      { day: '2026-05-17', sessions: 3 },
      { day: '2026-05-18', sessions: 1 },
      { day: '2026-05-19', sessions: 4 },
      { day: '2026-05-20', sessions: 5 },
    ]),
    loadTokensPerDay: vi.fn().mockResolvedValue([
      { day: '2026-05-14', tokens: 1000, costCents: 10 },
      { day: '2026-05-15', tokens: 2000, costCents: 20 },
      { day: '2026-05-16', tokens: 0, costCents: 0 },
      { day: '2026-05-17', tokens: 3000, costCents: 30 },
      { day: '2026-05-18', tokens: 1000, costCents: 10 },
      { day: '2026-05-19', tokens: 4000, costCents: 40 },
      { day: '2026-05-20', tokens: 5000, costCents: 50 },
    ]),
    loadTopCostSessions: vi.fn().mockResolvedValue([
      {
        sessionId: 'session-aaaabbbb',
        userIdPrefix: '01234567',
        costCents: 99,
        totalTokens: 19134,
        createdAt: '2026-05-19T01:00:00Z',
      },
    ]),
    loadFlagAndErrorRates: vi.fn().mockResolvedValue({
      sessionsThisWeek: 16,
      flagsThisWeek: 2,
      abortedThisWeek: 1,
      flagRate: 12.5,
      errorRate: 6.25,
    }),
  }
})

import AdminPage, { metadata } from '@/app/admin/page'

describe('/admin page', () => {
  it('exports noindex metadata', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe('admin · boardroom')
  })

  it('renders the H1, admin email line, and five tiles populated from the loaders', async () => {
    const element = await AdminPage()
    render(element as React.ReactElement)
    expect(
      screen.getByRole('heading', { level: 1, name: /^admin$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/signed in as admin@example\.com \(admin\)/i)).toBeInTheDocument()
    expect(screen.getByText(/16 total/i)).toBeInTheDocument()
    expect(screen.getByText(/16k total/i)).toBeInTheDocument()
    expect(screen.getByText(/12\.5%/)).toBeInTheDocument()
    expect(screen.getByText(/6\.3%/)).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 16/)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 16/)).toBeInTheDocument()
    expect(screen.getByText(/19,134 tok/)).toBeInTheDocument()
  })

  it('renders — sentinels when a loader rejects (page does not crash)', async () => {
    const queries = await import('@/lib/admin/queries')
    const sessionsMock = vi.mocked(queries.loadSessionsPerDay)
    const tokensMock = vi.mocked(queries.loadTokensPerDay)
    sessionsMock.mockRejectedValueOnce(new Error('rls denied'))
    tokensMock.mockRejectedValueOnce(new Error('column missing'))
    const element = await AdminPage()
    render(element as React.ReactElement)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/no data yet/i).length).toBeGreaterThanOrEqual(2)
  })
})
