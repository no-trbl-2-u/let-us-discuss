// Phase 7a: the AnthropicConfigError type ships so 7b's imports work on
// day-one. The factory is a thin env-check; the actual SDK call surface
// lands in 7b. We intentionally do not depend on @anthropic-ai/sdk here —
// 7b adds that dependency alongside the real call code.

export class AnthropicConfigError extends Error {
  readonly code = 'anthropic-config'
  constructor(message: string) {
    super(message)
    this.name = 'AnthropicConfigError'
  }
}

export type AnthropicClient = {
  readonly apiKey: string
  readonly model: string
}

const DEFAULT_MODEL = 'claude-opus-4-7'

export function getAnthropicClient(
  env: NodeJS.ProcessEnv = process.env,
): AnthropicClient {
  const apiKey = env.ANTHROPIC_API_KEY
  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new AnthropicConfigError(
      'ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example).',
    )
  }
  const model =
    typeof env.ANTHROPIC_MODEL === 'string' && env.ANTHROPIC_MODEL.trim() !== ''
      ? env.ANTHROPIC_MODEL.trim()
      : DEFAULT_MODEL
  return { apiKey: apiKey.trim(), model }
}
