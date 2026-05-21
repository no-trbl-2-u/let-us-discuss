import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdmin = vi.fn()
const loadAppliedMigrations = vi.fn()
const listMigrationFiles = vi.fn()
const createServerClient = vi.fn()

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}))

vi.mock('@/lib/admin/migrations', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/migrations')>(
    '@/lib/admin/migrations',
  )
  return {
    ...actual,
    loadAppliedMigrations: (...args: unknown[]) =>
      loadAppliedMigrations(...args),
    listMigrationFiles: (...args: unknown[]) => listMigrationFiles(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: (...args: unknown[]) => createServerClient(...args),
}))

import MigrationsPage from '@/app/admin/migrations/page'

describe('/admin/migrations page', () => {
  beforeEach(() => {
    requireAdmin.mockReset()
    loadAppliedMigrations.mockReset()
    listMigrationFiles.mockReset()
    createServerClient.mockReset()
    requireAdmin.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' })
    createServerClient.mockResolvedValue({})
  })

  it('renders the breadcrumb + heading', async () => {
    loadAppliedMigrations.mockResolvedValue([])
    listMigrationFiles.mockReturnValue([])
    const Component = await MigrationsPage()
    render(Component)
    expect(
      screen.getByRole('heading', { level: 1, name: /migrations/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/0 applied · 0 pending/i)).toBeInTheDocument()
  })

  it('renders the bootstrap-pending message when loadAppliedMigrations throws', async () => {
    loadAppliedMigrations.mockRejectedValue(
      new Error('relation "applied_migrations" does not exist'),
    )
    listMigrationFiles.mockReturnValue(['20260516_phase_7_sessions.sql'])
    const Component = await MigrationsPage()
    render(Component)
    expect(screen.getByTestId('bootstrap-pending')).toBeInTheDocument()
    expect(screen.getByText(/SUPABASE_DB_URL/)).toBeInTheDocument()
  })

  it('marks a file as applied when present in loadAppliedMigrations', async () => {
    loadAppliedMigrations.mockResolvedValue([
      {
        filename: '20260516_phase_7_sessions.sql',
        appliedAt: '2026-05-16T12:00:00Z',
      },
    ])
    listMigrationFiles.mockReturnValue([
      '20260516_phase_7_sessions.sql',
      '20260520_phase_26_byok.sql',
    ])
    const Component = await MigrationsPage()
    render(Component)
    expect(screen.getByText(/1 applied · 1 pending/i)).toBeInTheDocument()
    expect(screen.getByText(/applied 2026-05-16 12:00 UTC/)).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })
})

