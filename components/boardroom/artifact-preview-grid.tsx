'use client'

import { ArtifactTile } from '@/design/primitives/artifact-tile'
import { useMemo, useState } from 'react'
import { type ArtifactKind, downloadArtifact } from './download-artifact'
import type { SessionArtifact } from './use-session-state'

type Props = {
  artifact: SessionArtifact
  tokensUsed: number
  sessionId: string | null
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

export function ArtifactPreviewGrid({
  artifact,
  tokensUsed,
  sessionId,
  wrapped,
}: Props) {
  // Captured once per first render of a given artifact so the byline +
  // download filename stay stable across re-renders within a session.
  const finishedAt = useMemo(() => new Date(), [artifact])
  const finishedAtLabel = 'just now'
  const [downloaded, setDownloaded] = useState<Record<ArtifactKind, boolean>>({
    spec: false,
    summary: false,
    callouts: false,
  })

  function handleDownload(kind: ArtifactKind, body: string) {
    const sid = sessionId ?? '00000000'
    const ok = downloadArtifact({
      kind,
      body,
      sessionId: sid,
      finishedAt,
    })
    if (ok) setDownloaded((prev) => ({ ...prev, [kind]: true }))
  }

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
          finishedAt={finishedAtLabel}
          downloadable
          downloaded={downloaded.spec}
          onDownload={() => handleDownload('spec', artifact.specMd)}
        />
        <ArtifactTile
          kind="summary"
          title="exec summary"
          excerpt={firstLines(artifact.execSummary)}
          tokensUsed={tokensUsed}
          finishedAt={finishedAtLabel}
          downloadable
          downloaded={downloaded.summary}
          onDownload={() => handleDownload('summary', artifact.execSummary)}
        />
        <ArtifactTile
          kind="callouts"
          title="call-outs"
          excerpt={firstLines(artifact.callouts)}
          tokensUsed={tokensUsed}
          finishedAt={finishedAtLabel}
          downloadable
          downloaded={downloaded.callouts}
          onDownload={() => handleDownload('callouts', artifact.callouts)}
        />
      </div>
    </section>
  )
}
