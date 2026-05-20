import { estimateCostCents } from '@/lib/observability/pricing'

/**
 * Hand-pinned representative ranges per session for the
 * pre-session estimate. Tuned to cover a typical four-persona
 * confer + checkpoint + artifact phase under the default
 * orchestrator. Wide band on purpose — a "rough estimate"
 * with honest spread beats a precise-looking number that
 * misses real sessions by 2×.
 *
 * Tunable via PR. If accuracy proves load-bearing per
 * template, file the per-template typical map (phase 25
 * Follow-up). Don't switch to per-user learning until that
 * proves insufficient — new users have no history.
 */
export const TYPICAL_SESSION = {
  promptMin: 4_000,
  promptMax: 12_000,
  completionMin: 2_000,
  completionMax: 8_000,
} as const

export type UsageEstimate = {
  tokensMin: number
  tokensMax: number
  /** null when the model isn't in MODEL_RATES — UI renders `—` */
  costCentsMin: number | null
  costCentsMax: number | null
}

export function estimateSessionUsage(model: string): UsageEstimate {
  const tokensMin = TYPICAL_SESSION.promptMin + TYPICAL_SESSION.completionMin
  const tokensMax = TYPICAL_SESSION.promptMax + TYPICAL_SESSION.completionMax
  const costMin = estimateCostCents(
    model,
    TYPICAL_SESSION.promptMin,
    TYPICAL_SESSION.completionMin,
  )
  const costMax = estimateCostCents(
    model,
    TYPICAL_SESSION.promptMax,
    TYPICAL_SESSION.completionMax,
  )
  return {
    tokensMin,
    tokensMax,
    costCentsMin: costMin,
    costCentsMax: costMax,
  }
}
