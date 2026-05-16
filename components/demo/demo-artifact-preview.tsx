'use client'

import { ArtifactTile } from '@/design/primitives/artifact-tile'
import { cannedSession } from '@/lib/demo/canned-session'

export function DemoArtifactPreview() {
  return (
    <section aria-label="Demo artifact preview" className="flex flex-col gap-[var(--space-3)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        artifacts &nbsp;·&nbsp; preview only
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)]">
        {cannedSession.artifacts.map((artifact) => (
          <ArtifactTile
            key={artifact.kind}
            kind={artifact.kind}
            title={artifact.title}
            excerpt={artifact.excerpt}
            tokensUsed={artifact.tokensUsed}
            finishedAt="just now"
            downloadable={false}
            signInHref="/signin?next=/app"
          />
        ))}
      </div>
    </section>
  )
}
