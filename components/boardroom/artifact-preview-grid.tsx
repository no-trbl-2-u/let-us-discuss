'use client'

import { ArtifactTile } from '@/design/primitives/artifact-tile'
import type { SessionArtifact } from './use-session-state'

type Props = {
  artifact: SessionArtifact
  tokensUsed: number
  wrapped?: boolean
}

function firstLines(body: string, lines = 2): string {
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join(' · ')
}

export function ArtifactPreviewGrid({ artifact, tokensUsed, wrapped }: Props) {
  const finishedAt = 'just now'
  return (
    <section aria-label="session artifacts" className="mt-[var(--space-5)]">
      {wrapped && (
        <p className="mb-[var(--space-3)] font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          ended early &nbsp;·&nbsp; token budget reached
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)]">
        <ArtifactTile
          kind="spec"
          title="spec.md"
          excerpt={firstLines(artifact.specMd)}
          tokensUsed={tokensUsed}
          finishedAt={finishedAt}
          downloadable
          onDownload={() => window.alert('Download UI ships in phase 10.')}
        />
        <ArtifactTile
          kind="summary"
          title="exec summary"
          excerpt={firstLines(artifact.execSummary)}
          tokensUsed={tokensUsed}
          finishedAt={finishedAt}
          downloadable
          onDownload={() => window.alert('Download UI ships in phase 10.')}
        />
        <ArtifactTile
          kind="callouts"
          title="call-outs"
          excerpt={firstLines(artifact.callouts)}
          tokensUsed={tokensUsed}
          finishedAt={finishedAt}
          downloadable
          onDownload={() => window.alert('Download UI ships in phase 10.')}
        />
      </div>
    </section>
  )
}
