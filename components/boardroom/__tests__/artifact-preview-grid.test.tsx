import { ArtifactPreviewGrid } from '@/components/boardroom/artifact-preview-grid'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
      />,
    )
    // Each tile renders the kind label + the title; the title for spec is
    // also "spec.md", so getByText matches multiple. Use getAllByText.
    expect(screen.getAllByText('spec.md').length).toBeGreaterThan(0)
    expect(screen.getAllByText('exec summary').length).toBeGreaterThan(0)
    expect(screen.getAllByText('call-outs').length).toBeGreaterThan(0)
  })
})
