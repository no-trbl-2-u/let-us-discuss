import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UsageTile } from '@/components/admin/usage-tile'

describe('UsageTile', () => {
  it('renders the header and body', () => {
    render(<UsageTile header="Sessions / day" body="42" />)
    expect(
      screen.getByRole('heading', { level: 2, name: /sessions \/ day/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders the secondary line when provided', () => {
    render(<UsageTile header="Flag rate" body="1.2%" secondary="3 / 246" />)
    expect(screen.getByText('1.2%')).toBeInTheDocument()
    expect(screen.getByText('3 / 246')).toBeInTheDocument()
  })

  it('omits the secondary slot when undefined', () => {
    const { container } = render(<UsageTile header="X" body="—" />)
    expect(container.querySelectorAll('div').length).toBe(1)
  })
})
