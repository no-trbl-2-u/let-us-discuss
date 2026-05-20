/**
 * Allowlist of Anthropic models the boardroom session can run
 * against. Order matters: `AVAILABLE_MODELS[0]` is the default,
 * derived as `DEFAULT_MODEL`. Adding/removing rows ships via PR.
 *
 * Each model in this list MUST have a matching entry in
 * `lib/observability/pricing.ts` MODEL_RATES so the post-session
 * SessionUsageFooter never renders `—` for an allowlisted model;
 * a vitest guard in `__tests__/models.test.ts` enforces that
 * invariant.
 */

export const AVAILABLE_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
] as const

export type AvailableModel = (typeof AVAILABLE_MODELS)[number]

export const DEFAULT_MODEL: AvailableModel = AVAILABLE_MODELS[0]

export const MODEL_LABELS: Readonly<Record<string, string>> = {
  'claude-opus-4-7': 'Opus 4.7 (default)',
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
}

export const MODEL_BLURBS: Readonly<Record<string, string>> = {
  'claude-opus-4-7': 'Default. Best reasoning, highest cost.',
  'claude-sonnet-4-6': 'Balanced. About 5× cheaper than Opus.',
  'claude-haiku-4-5-20251001':
    'Cheapest. Fastest; weakest on long-context arguments.',
}

export function modelLabel(model: string): string {
  return MODEL_LABELS[model] ?? model
}

export function modelBlurb(model: string): string {
  return MODEL_BLURBS[model] ?? ''
}

export function isAllowedModel(
  model: string | null | undefined,
): model is AvailableModel {
  if (typeof model !== 'string') return false
  const trimmed = model.trim()
  if (trimmed === '') return false
  return (AVAILABLE_MODELS as readonly string[]).includes(trimmed)
}

export function resolveModel(
  input: string | null | undefined,
): AvailableModel {
  return isAllowedModel(input) ? (input.trim() as AvailableModel) : DEFAULT_MODEL
}
