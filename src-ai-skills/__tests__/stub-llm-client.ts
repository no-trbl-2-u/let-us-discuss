import type { AnthropicStreamClient } from '@/lib/anthropic/conferring'

/**
 * Deterministic stub of the AnthropicStreamClient interface. Returns
 * canned replies in order; token counts derive from text length so
 * the budget tracker behaves predictably.
 *
 * Used by src-ai-skills framework tests to validate orchestrator
 * behavior without touching the network or the Anthropic SDK.
 */
export function makeStubClient(replies: string[]): AnthropicStreamClient {
  let i = 0
  return {
    async streamCompletion() {
      const text = replies[i] ?? `(stub reply ${i + 1})`
      i += 1
      const tokens = Math.max(1, Math.ceil(text.length / 4))
      const promptTokens = Math.max(1, Math.floor(tokens / 2))
      const completionTokens = Math.max(1, tokens - promptTokens)
      async function* deltas() {
        yield text
      }
      return {
        deltas: deltas(),
        final: Promise.resolve({
          text,
          tokens: promptTokens + completionTokens,
          promptTokens,
          completionTokens,
        }),
      }
    },
  }
}
