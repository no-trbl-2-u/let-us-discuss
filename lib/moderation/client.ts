// OpenAI omni-moderation pre-filter. Raw fetch — we use one endpoint, the
// full @openai/* SDK isn't worth the tree weight. Phase 8 brief locks the
// behaviors:
//   - Unset API key → allow + console.warn once per process. Local dev is
//     friendly; production is responsible for setting OPENAI_API_KEY.
//   - 200 response → trust `flagged` from the first result.
//   - Network error → fail-closed (flagged=true). Safety bias.

export type ModerationSurface = 'input' | 'output'

export type ModerationVerdict = {
  flagged: boolean
  allowed: boolean
  source: 'openai' | 'unconfigured' | 'error'
  categories?: Record<string, boolean>
  raw?: unknown
  error?: string
}

const OPENAI_URL = 'https://api.openai.com/v1/moderations'
const DEFAULT_MODEL = 'omni-moderation-latest'

let warnedUnset = false

function warnUnsetOnce(): void {
  if (warnedUnset) return
  warnedUnset = true
  // biome-ignore lint/suspicious/noConsole: intentional startup warning
  console.warn(
    '[moderation] OPENAI_API_KEY is unset — moderation gate is open. Set OPENAI_API_KEY in your env.',
  )
}

export function _resetWarnedForTests(): void {
  warnedUnset = false
}

export async function moderate(
  text: string,
  _context: { sessionId?: string; surface: ModerationSurface } = {
    surface: 'input',
  },
): Promise<ModerationVerdict> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    warnUnsetOnce()
    return { flagged: false, allowed: true, source: 'unconfigured' }
  }
  const model = process.env.OPENAI_MODERATION_MODEL?.trim() || DEFAULT_MODEL
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
    })
    if (!response.ok) {
      const message = `openai moderation http ${response.status}`
      // biome-ignore lint/suspicious/noConsole: surfacing for log scrape
      console.warn(`[moderation] ${message}`)
      return {
        flagged: true,
        allowed: false,
        source: 'error',
        categories: {},
        error: message,
      }
    }
    const json = (await response.json()) as {
      results?: { flagged?: boolean; categories?: Record<string, boolean> }[]
    }
    const first = json.results?.[0]
    const flagged = first?.flagged === true
    return {
      flagged,
      allowed: !flagged,
      source: 'openai',
      categories: first?.categories ?? {},
      raw: json,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // biome-ignore lint/suspicious/noConsole: surfacing for log scrape
    console.warn(`[moderation] network error: ${message}`)
    return {
      flagged: true,
      allowed: false,
      source: 'error',
      categories: {},
      error: message,
    }
  }
}
