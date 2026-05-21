import { logError } from '@/lib/observability/log'

// Server-side soft-enforcement for the clarify-question format
// (src-ai-skills/CLARIFY-QUESTION-FORMAT.md). Runs once per
// clarify-phase turn after the persona's text finalizes. Pure +
// synchronous; the only side effect is a single optional log line.

export const RECOMMENDED_MARKER = '(Recommended)'
export const CLARIFY_FORMAT_TAG = 'clarify-format'

export type ClarifyFormatReport = {
  hasRecommended: boolean
  hasTradeoffOptions: boolean
  isFreeForm: boolean
}

const BULLET_LINE_RE = /^\s*(?:[-*]|\d+\.)\s+\S/m
const OPTION_TRADEOFF_RE = /^\s*(?:[-*]|\d+\.)\s+.+(?: — |: ).+/m

export function validateClarifyFormat(text: string): ClarifyFormatReport {
  const trimmed = text.trim()
  const hasBullets = BULLET_LINE_RE.test(trimmed)
  const endsWithQuestion = trimmed.endsWith('?')

  // Heuristic: a question with no enumerated options that ends in `?`
  // is a free-form ask (project name, audience description, etc.).
  // Errs on under-flagging so the log drain doesn't get noised by
  // legitimately free-form questions.
  const isFreeForm = !hasBullets && endsWithQuestion

  const hasRecommended = trimmed.includes(RECOMMENDED_MARKER)
  const hasTradeoffOptions = OPTION_TRADEOFF_RE.test(trimmed)

  return { hasRecommended, hasTradeoffOptions, isFreeForm }
}

export type LogClarifyContext = {
  sessionId: string
  personaSlug: string | null
}

export function logClarifyFormatIssues(
  report: ClarifyFormatReport,
  context: LogClarifyContext,
): void {
  if (report.isFreeForm) return
  const missingRecommended = !report.hasRecommended
  const missingTradeoff = !report.hasTradeoffOptions
  if (!missingRecommended && !missingTradeoff) return

  const missing: 'recommended' | 'tradeoff-descriptions' | 'recommended-and-tradeoff' =
    missingRecommended && missingTradeoff
      ? 'recommended-and-tradeoff'
      : missingRecommended
        ? 'recommended'
        : 'tradeoff-descriptions'

  logError(
    'orchestrator',
    new Error(`clarify-format drift: missing ${missing}`),
    {
      tag: CLARIFY_FORMAT_TAG,
      sessionId: context.sessionId,
      personaSlug: context.personaSlug ?? '<none>',
      missing,
    },
  )
}
