import { SessionList } from '@/components/sessions/session-list'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('SessionList', () => {
  it('renders SessionEmpty when items is empty', () => {
    render(<SessionList items={[]} />)
    expect(screen.getByText(/No sessions yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start one/i })).toHaveAttribute(
      'href',
      '/app',
    )
  })

  it('renders one item per session', () => {
    render(
      <SessionList
        items={[
          {
            id: 'sid-1',
            status: 'done',
            totalTokens: 1234,
            createdAt: '2026-05-16T12:00:00Z',
            pitchExcerpt: 'First pitch',
            templateSlug: 'pitch-to-spec',
            personaSlugs: ['lead'],
          },
          {
            id: 'sid-2',
            status: 'aborted',
            totalTokens: 0,
            createdAt: '2026-05-15T12:00:00Z',
            pitchExcerpt: 'Second pitch',
            templateSlug: 'pitch-to-spec',
            personaSlugs: ['lead'],
          },
        ]}
      />,
    )
    expect(screen.getByText('First pitch')).toBeInTheDocument()
    expect(screen.getByText('Second pitch')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /open results/i }).length).toBe(
      2,
    )
  })
})
