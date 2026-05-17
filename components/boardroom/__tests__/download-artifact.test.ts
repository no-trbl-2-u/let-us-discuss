import {
  buildArtifactFilename,
  downloadArtifact,
} from '@/components/boardroom/download-artifact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('buildArtifactFilename', () => {
  it('uses the first 8 chars of the UUID + ISO date + kind suffix', () => {
    const name = buildArtifactFilename({
      kind: 'spec',
      body: '# spec',
      sessionId: 'a3b1c2d4-5566-4777-8888-9999aaaabbbb',
      finishedAt: new Date('2026-05-16T12:00:00Z'),
    })
    expect(name).toBe('boardroom-a3b1c2d4-2026-05-16-spec.md')
  })

  it('uses .md for all three kinds', () => {
    const make = (kind: 'spec' | 'summary' | 'callouts') =>
      buildArtifactFilename({
        kind,
        body: 'x',
        sessionId: 'abcdef01-...',
        finishedAt: new Date('2026-05-16T00:00:00Z'),
      })
    expect(make('spec')).toMatch(/-spec\.md$/)
    expect(make('summary')).toMatch(/-summary\.md$/)
    expect(make('callouts')).toMatch(/-callouts\.md$/)
  })
})

describe('downloadArtifact', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let clicked: HTMLAnchorElement | null

  beforeEach(() => {
    createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    revokeObjectURL = vi.fn()
    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      configurable: true,
      value: revokeObjectURL,
    })
    clicked = null
    const original = HTMLAnchorElement.prototype.click
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function spyClick(this: HTMLAnchorElement) {
        clicked = this
        return original.call(this)
      },
    )
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds a Blob with the right MIME, clicks an anchor, revokes the URL', () => {
    const ok = downloadArtifact({
      kind: 'spec',
      body: '# spec\n\n- one',
      sessionId: 'sid-12345678-...',
      finishedAt: new Date('2026-05-16T00:00:00Z'),
    })
    expect(ok).toBe(true)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.type).toBe('text/markdown;charset=utf-8')
    expect(clicked).not.toBeNull()
    expect(clicked?.download).toBe('boardroom-sid-1234-2026-05-16-spec.md')
    expect(clicked?.href).toContain('blob:mock-url')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('emits text/plain for the summary kind', () => {
    downloadArtifact({
      kind: 'summary',
      body: 'paragraph one\n\nparagraph two',
      sessionId: 'sid-12345678-...',
      finishedAt: new Date('2026-05-16T00:00:00Z'),
    })
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.type).toBe('text/plain;charset=utf-8')
  })

  it('emits text/markdown for callouts', () => {
    downloadArtifact({
      kind: 'callouts',
      body: '- one\n- two',
      sessionId: 'sid-12345678-...',
      finishedAt: new Date('2026-05-16T00:00:00Z'),
    })
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.type).toBe('text/markdown;charset=utf-8')
  })
})
