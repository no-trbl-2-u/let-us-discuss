import { LiveTranscript } from '@/components/boardroom/live-transcript'
import type { SessionTurn } from '@/components/boardroom/use-session-state'
import type { Persona } from '@framework/schemas/persona'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function makePersona(slug: string, name: string): Persona {
  return {
    slug,
    name,
    role: 'lead',
    voice: 'concrete',
    lead: true,
    tools: [],
    summary: 'x'.repeat(40),
    systemPrompt: 'x'.repeat(80),
  }
}

describe('LiveTranscript', () => {
  it('shows the thinking moderator when there are no turns yet', () => {
    render(<LiveTranscript turns={[]} personasBySlug={new Map()} />)
    expect(screen.getByLabelText(/Boardroom is thinking/i)).toBeInTheDocument()
  })

  it('renders persona turns with persona name + voice', () => {
    const turns: SessionTurn[] = [
      {
        id: 't1',
        phase: 'clarify',
        author: 'persona',
        personaSlug: 'lead-a',
        replyingTo: null,
        body: 'A clarifying question.',
        tokens: 5,
        closed: true,
      },
    ]
    const personas = new Map([['lead-a', makePersona('lead-a', 'Lead A')]])
    render(<LiveTranscript turns={turns} personasBySlug={personas} />)
    expect(screen.getByText('Lead A')).toBeInTheDocument()
    expect(screen.getByText(/A clarifying question/i)).toBeInTheDocument()
  })

  it('exposes the transcript region as a polite live log', () => {
    const turns: SessionTurn[] = [
      {
        id: 't1',
        phase: 'clarify',
        author: 'persona',
        personaSlug: null,
        replyingTo: null,
        body: 'hello',
        tokens: 0,
        closed: true,
      },
    ]
    const { container } = render(
      <LiveTranscript turns={turns} personasBySlug={new Map()} />,
    )
    const region = container.querySelector('section')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('role')).toBe('log')
    expect(region?.getAttribute('aria-live')).toBe('polite')
    expect(region?.getAttribute('aria-label')).toBe('session transcript')
  })

  it('labels moderator turns with the Boardroom register', () => {
    const turns: SessionTurn[] = [
      {
        id: 'tm',
        phase: 'exec-summary',
        author: 'moderator',
        personaSlug: null,
        replyingTo: null,
        body: 'Moderator interjection.',
        tokens: 0,
        closed: true,
      },
    ]
    render(<LiveTranscript turns={turns} personasBySlug={new Map()} />)
    expect(screen.getByText('Boardroom')).toBeInTheDocument()
    expect(screen.getByText(/Moderator interjection/i)).toBeInTheDocument()
  })
})
