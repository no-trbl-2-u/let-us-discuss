// e2e/helpers/magic-link-inbox.ts
// ---------------------------------------------------------------------------
// Pluggable inbox abstraction for the magic-link e2e walk.
//
// The Playwright spec at e2e/auth-flow.spec.ts gates on the factory
// returning a non-null inbox; when MAGIC_LINK_INBOX_PROVIDER is unset
// (or set to "none") the spec skips, keeping the verify gate green
// while the auth-flow scaffolding still lives in the repo. The moment
// an operator wires real credentials, the spec lights up.
//
// v1 ships:
//   - "none"      — default; no inbox; spec skips.
//   - "mailosaur" — REST polling against Mailosaur; no SDK install
//                   needed (uses fetch).
//
// Follow-ups (separate iterate ticks if/when needed):
//   - "gmail-app-password" via IMAP
//   - "inbucket" for self-hosted catchers
// ---------------------------------------------------------------------------

export type MagicLinkInboxProvider = 'none' | 'mailosaur'

export interface WaitForMagicLinkOpts {
  to: string
  /** Mailbox-sender filter, optional. */
  sender?: string
  /** Wall-clock timeout. Default 60s. */
  timeoutMs?: number
  /** Poll cadence. Default 2s. */
  pollMs?: number
}

export interface MagicLinkInbox {
  /** Resolves with the magic-link URL extracted from the latest match. */
  waitForMagicLink(opts: WaitForMagicLinkOpts): Promise<string>
}

export type EnvSource = Record<string, string | undefined>

/**
 * Read the configured provider from env and return an inbox, or null
 * when no provider is wired. Callers should test.skip() on null.
 */
export function magicLinkInboxFromEnv(
  env: EnvSource = process.env as EnvSource,
): MagicLinkInbox | null {
  const provider = (env.MAGIC_LINK_INBOX_PROVIDER ?? 'none') as MagicLinkInboxProvider
  switch (provider) {
    case 'mailosaur':
      return makeMailosaurInbox(env)
    case 'none':
    default:
      return null
  }
}

function makeMailosaurInbox(env: EnvSource): MagicLinkInbox {
  const apiKey = env.MAILOSAUR_API_KEY
  const serverId = env.MAILOSAUR_SERVER_ID
  if (!apiKey || !serverId) {
    throw new Error(
      'MAGIC_LINK_INBOX_PROVIDER=mailosaur requires MAILOSAUR_API_KEY + MAILOSAUR_SERVER_ID',
    )
  }
  return {
    async waitForMagicLink({
      to,
      sender,
      timeoutMs = 60_000,
      pollMs = 2_000,
    }) {
      const sentAfter = new Date(Date.now() - 30_000).toISOString()
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        const messageId = await searchMailosaur(apiKey, serverId, to, sender, sentAfter)
        if (messageId) {
          const link = await fetchMagicLinkFromMessage(apiKey, messageId)
          if (link) return link
        }
        await sleep(pollMs)
      }
      throw new Error(
        `Mailosaur: no magic-link email for ${to} within ${timeoutMs}ms`,
      )
    },
  }
}

async function searchMailosaur(
  apiKey: string,
  serverId: string,
  to: string,
  sender: string | undefined,
  sentAfter: string,
): Promise<string | null> {
  // Mailosaur's POST /api/messages/search endpoint accepts a filter
  // body; we keep it minimal and let the timeout drive retries.
  const body: Record<string, unknown> = {
    sentTo: to,
    sentFrom: sender,
    receivedAfter: sentAfter,
  }
  const res = await fetch(
    `https://mailosaur.com/api/messages/search?server=${encodeURIComponent(serverId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) return null
  const data = (await res.json()) as { items?: Array<{ id?: string }> }
  return data.items?.[0]?.id ?? null
}

async function fetchMagicLinkFromMessage(
  apiKey: string,
  messageId: string,
): Promise<string | null> {
  const res = await fetch(
    `https://mailosaur.com/api/messages/${encodeURIComponent(messageId)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
    },
  )
  if (!res.ok) return null
  const data = (await res.json()) as {
    html?: { links?: Array<{ href?: string }> }
    text?: { links?: Array<{ href?: string }> }
  }
  const candidates = [
    ...(data.html?.links ?? []),
    ...(data.text?.links ?? []),
  ]
  return extractMagicLink(candidates.map((c) => c.href).filter(isString))
}

export function extractMagicLink(urls: string[]): string | null {
  // Supabase magic links carry either a `code` query param (PKCE) or a
  // `token_hash` / `type=magiclink` shape. Both flow through
  // /auth/callback when the email template uses {{ .SiteURL }}. Filter
  // by /auth/callback first; fall back to any URL that mentions
  // "verify" or "auth".
  const byCallback = urls.find((u) => /\/auth\/callback\b/.test(u))
  if (byCallback) return byCallback
  const byAuthish = urls.find((u) => /auth|verify|magic/i.test(u))
  return byAuthish ?? null
}

function isString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
