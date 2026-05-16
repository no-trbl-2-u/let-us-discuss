import { DEMO_TURN_COUNT } from '@/lib/limits'

export type CannedTurn = {
  body: string
  /** Approximate token cost — purely cosmetic in this phase. */
  tokens: number
  /** "Replying to" pointer for the second + third turn. */
  replyingTo?: string
}

export type CannedArtifact = {
  kind: 'spec' | 'summary' | 'callouts'
  title: string
  excerpt: string
  tokensUsed: number
}

/**
 * 3 canned turns + 3 artifact previews. Pitch-agnostic by design —
 * the demo cannot reference what the user typed because we have no
 * AI here, and pretending we did would be uncanny. The transcript
 * shows the *shape* of a session; real responses arrive on /app
 * post-sign-in.
 */
export const cannedSession = {
  turns: [
    {
      body: 'Quick clarifier — when you say "the user", is that the *first* user (someone landing cold) or a returning one? The answer changes whether we optimize for orientation or recall.',
      tokens: 86,
    },
    {
      body: 'Useful — that means the spec leads with orientation copy, not preference defaults. The skeptical engineer will want guarantees on the cold-start path; the growth voice will want one CTA above the fold.',
      tokens: 124,
      replyingTo: 'Product lead',
    },
    {
      body: 'Boardroom suggests we wrap: the smallest version is a single landing page + one short demo path. Spec, exec summary, and call-outs are below — sign in to download or push further.',
      tokens: 96,
      replyingTo: 'the table',
    },
  ] satisfies CannedTurn[],

  artifacts: [
    {
      kind: 'spec',
      title: 'spec.md',
      excerpt:
        "Landing page introduces the product in one paragraph; a single CTA opens a short demo session. No account required for the demo; signed-in users can persist sessions and download artifacts.",
      tokensUsed: 1280,
    },
    {
      kind: 'summary',
      title: 'Executive summary',
      excerpt:
        'Build the minimum thing that earns the user’s first “yes”: one landing page, one short demo, one sign-in path. Defer multi-persona variants until the demo path has measurable pull.',
      tokensUsed: 412,
    },
    {
      kind: 'callouts',
      title: 'Out-of-scope call-outs',
      excerpt:
        'Multi-tenant accounts; team collaboration; persona authoring UI; pricing tiers; mobile push. Each is plausible v2 but adds scope cost the v1 demo path cannot afford.',
      tokensUsed: 188,
    },
  ] satisfies CannedArtifact[],
} as const

if (cannedSession.turns.length !== DEMO_TURN_COUNT) {
  throw new Error(
    `cannedSession.turns length (${cannedSession.turns.length}) must equal DEMO_TURN_COUNT (${DEMO_TURN_COUNT}); update lib/limits.ts or this module together.`,
  )
}
