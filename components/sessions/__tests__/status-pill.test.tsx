import { StatusPill } from '@/components/sessions/status-pill'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('StatusPill', () => {
  it('renders the status text in muted ink for done', () => {
    render(<StatusPill status="done" />)
    expect(screen.getByText('done')).toBeInTheDocument()
  })

  it('renders italic styling for in-flight statuses', () => {
    render(<StatusPill status="clarify" />)
    const pill = screen.getByText('clarify')
    expect(pill.className).toContain('italic')
  })
})
