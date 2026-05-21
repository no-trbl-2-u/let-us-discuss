import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  MigrationsTable,
  type MigrationRow,
} from '@/components/admin/migrations-table'

describe('MigrationsTable', () => {
  it('renders an empty-state line when no rows are provided', () => {
    render(<MigrationsTable rows={[]} />)
    expect(
      screen.getByText(/no migrations under db\/migrations\//i),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('migrations-table')).toBeNull()
  })

  it('renders a row per migration with state label and data attribute', () => {
    const rows: MigrationRow[] = [
      {
        filename: '20260516_phase_7_sessions.sql',
        appliedAt: '2026-05-16T12:34:00Z',
      },
      {
        filename: '20260520_phase_26_byok.sql',
        appliedAt: null,
      },
    ]
    render(<MigrationsTable rows={rows} />)
    expect(screen.getByTestId('migrations-table')).toBeInTheDocument()
    expect(
      screen.getByText('20260516_phase_7_sessions.sql'),
    ).toBeInTheDocument()
    expect(screen.getByText(/applied 2026-05-16 12:34 UTC/)).toBeInTheDocument()
    expect(screen.getByText('20260520_phase_26_byok.sql')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('marks the pending row with data-state="pending" and applied with data-state="applied"', () => {
    const rows: MigrationRow[] = [
      {
        filename: 'a.sql',
        appliedAt: '2026-05-21T00:00:00Z',
      },
      {
        filename: 'b.sql',
        appliedAt: null,
      },
    ]
    const { container } = render(<MigrationsTable rows={rows} />)
    const applied = container.querySelector('tr[data-state="applied"]')
    const pending = container.querySelector('tr[data-state="pending"]')
    expect(applied?.textContent).toContain('a.sql')
    expect(pending?.textContent).toContain('b.sql')
  })
})
