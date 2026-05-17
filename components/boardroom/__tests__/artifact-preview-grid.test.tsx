import { ArtifactPreviewGrid } from '@/components/boardroom/artifact-preview-grid'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const downloadArtifact = vi.fn().mockReturnValue(true)

vi.mock('@/components/boardroom/download-artifact', async () => {
  const actual = await vi.importActual<
    typeof import('@/components/boardroom/download-artifact')
  >('@/components/boardroom/download-artifact')
  return {
    ...actual,
    downloadArtifact: (...args: unknown[]) => downloadArtifact(...args),
  }
})

describe('ArtifactPreviewGrid', () => {
  it('renders three artifact tiles with the spec/summary/callouts kinds', () => {
    render(
      <ArtifactPreviewGrid
        artifact={{
          specMd: '# Spec\n## Overview\nThis is the spec.',
          execSummary: 'Two-paragraph summary.',
          callouts: '- one\n- two',
        }}
        tokensUsed={4321}
        sessionId="sid-12345678-aaaa"
      />,
    )
    expect(screen.getAllByText('spec.md').length).toBeGreaterThan(0)
    expect(screen.getAllByText('exec summary').length).toBeGreaterThan(0)
    expect(screen.getAllByText('call-outs').length).toBeGreaterThan(0)
  })

  it('forwards downloads to the helper with the right kind + body', () => {
    downloadArtifact.mockClear()
    render(
      <ArtifactPreviewGrid
        artifact={{
          specMd: '# spec body',
          execSummary: 'summary body',
          callouts: '- one',
        }}
        tokensUsed={42}
        sessionId="sid-12345678-aaaa"
      />,
    )
    const buttons = screen.getAllByRole('button', { name: /download/i })
    fireEvent.click(buttons[0]!)
    fireEvent.click(buttons[1]!)
    fireEvent.click(buttons[2]!)
    expect(downloadArtifact).toHaveBeenCalledTimes(3)
    const kinds = downloadArtifact.mock.calls.map(
      (c) => (c[0] as { kind: string }).kind,
    )
    expect(kinds).toEqual(['spec', 'summary', 'callouts'])
    const bodies = downloadArtifact.mock.calls.map(
      (c) => (c[0] as { body: string }).body,
    )
    expect(bodies).toEqual(['# spec body', 'summary body', '- one'])
  })
})
