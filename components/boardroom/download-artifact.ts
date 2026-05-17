'use client'

// Pure client-side artifact download. The bytes are already in the page
// (the orchestrator delivered them via SSE; SessionArtifact lives in the
// reducer); we just build a Blob + anchor + click. Filename shape is
// locked in plan/phases/phase_10_artifact_download.md.

export type ArtifactKind = 'spec' | 'summary' | 'callouts'

const EXTENSION_PER_KIND: Record<ArtifactKind, string> = {
  spec: 'md',
  summary: 'md',
  callouts: 'md',
}

const MIME_PER_KIND: Record<ArtifactKind, string> = {
  spec: 'text/markdown;charset=utf-8',
  callouts: 'text/markdown;charset=utf-8',
  // Exec summary is prose — opening as markdown would tempt clients to
  // render bullets that aren't there. Keep it plain.
  summary: 'text/plain;charset=utf-8',
}

export type DownloadArtifactInput = {
  kind: ArtifactKind
  body: string
  sessionId: string
  finishedAt?: Date
}

export function buildArtifactFilename(input: DownloadArtifactInput): string {
  const date = (input.finishedAt ?? new Date()).toISOString().slice(0, 10)
  const sid8 = input.sessionId.slice(0, 8)
  const ext = EXTENSION_PER_KIND[input.kind]
  return `boardroom-${sid8}-${date}-${input.kind}.${ext}`
}

export function downloadArtifact(input: DownloadArtifactInput): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }
  const filename = buildArtifactFilename(input)
  const blob = new Blob([input.body], { type: MIME_PER_KIND[input.kind] })
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
  return true
}
