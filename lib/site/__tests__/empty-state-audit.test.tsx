import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionEmpty } from '@/components/sessions/session-empty'
import { EMPTY_STATE_TEMPLATE_RE } from '@/lib/site/empty-state-copy'

/**
 * Drift gate: every shipped empty-state surface must render
 * copy matching the bearings template. If a future
 * empty-state surface lands, add it here so the gate
 * keeps growing with the codebase.
 */
function visibleText(node: HTMLElement): string {
  // Collapse whitespace and strip child-link punctuation so
  // <p>No X yet — <a>do thing</a>.</p> renders as
  // "No X yet — do thing.".
  return (node.textContent ?? '').replace(/\s+/g, ' ').trim()
}

describe('every shipped empty-state surface clears the bearings template', () => {
  it('SessionEmpty (/app/sessions)', () => {
    const { container } = render(<SessionEmpty />)
    const text = visibleText(container)
    expect(text, `actual: "${text}"`).toMatch(EMPTY_STATE_TEMPLATE_RE)
  })

  it('PersonasPage empty branch (/about/personas with no personas)', async () => {
    // The page reads from loadPersonas(); mock it to the empty case.
    vi.doMock('@/lib/personas/load', () => ({ loadPersonas: () => [] }))
    const { default: PersonasPage } = await import(
      '@/app/about/personas/page'
    )
    const { container } = render(PersonasPage())
    const paragraphs = Array.from(container.querySelectorAll('p'))
    // The empty-state paragraph is the one that includes "No personas yet".
    const empty = paragraphs
      .map(visibleText)
      .find((t) => t.startsWith('No personas yet'))
    expect(empty, 'empty-state paragraph not found').toBeDefined()
    expect(empty).toMatch(EMPTY_STATE_TEMPLATE_RE)
    vi.doUnmock('@/lib/personas/load')
  })
})
