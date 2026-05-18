/**
 * Anthropic Claude pricing — cents per million tokens (MTOK).
 *
 * Reviewed: 2026-05-18. Refresh via /iterate if rates move.
 * Sources: anthropic.com/pricing (canonical) + the Claude
 * API docs. Numbers below are the published per-MTOK rates
 * expressed in cents (USD).
 *
 * Unrecognized models return null from estimateCostCents so
 * the footer renders `—` instead of guessing.
 */

interface ModelRate {
  /** cents per million prompt tokens */
  promptCpm: number
  /** cents per million completion tokens */
  completionCpm: number
}

export const MODEL_RATES: Readonly<Record<string, ModelRate>> = {
  // Opus 4.x — flagship, premium pricing
  'claude-opus-4-7': { promptCpm: 1500, completionCpm: 7500 },
  'claude-opus-4-6': { promptCpm: 1500, completionCpm: 7500 },

  // Sonnet 4.x — balanced default
  'claude-sonnet-4-6': { promptCpm: 300, completionCpm: 1500 },
  'claude-sonnet-4-5': { promptCpm: 300, completionCpm: 1500 },

  // Haiku 4.x — cheap + fast
  'claude-haiku-4-5-20251001': { promptCpm: 100, completionCpm: 500 },
  'claude-haiku-4-5': { promptCpm: 100, completionCpm: 500 },
}

/**
 * Estimate the cost (in integer cents) of a prompt+completion
 * pair against the given model. Returns null for unrecognized
 * models so the consuming surface can render `—`.
 *
 * Rounding: ceil on the full cents value, so a 0.3-cent
 * usage shows as 1 cent (we'd rather slightly over-state
 * cost than under-state).
 */
export function estimateCostCents(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number | null {
  const rate = MODEL_RATES[model]
  if (!rate) return null
  const raw =
    (promptTokens * rate.promptCpm + completionTokens * rate.completionCpm) /
    1_000_000
  if (raw === 0) return 0
  return Math.ceil(raw)
}
