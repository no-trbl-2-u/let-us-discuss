import Anthropic from '@anthropic-ai/sdk'
import { getMasterKey } from '@/lib/byok/master-key'
import { getDecryptedKey } from '@/lib/byok/repo'
import { logError } from '@/lib/observability/log'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import type { AnthropicStreamClient } from './conferring'

// Re-export so the existing test surface keeps importing from here.
export { BYOK_BANNER_TEXT } from '@/lib/byok/banner-text'

// Server-only. Phase 27's single decision point for "did this session
// pay with the user's key or the project key?". Called once at session
// create; the answer is locked for the session's lifetime so a
// mid-session rotate cannot race a streaming completion.

export type KeyOrigin = 'user' | 'project'

export type ResolveSessionClientInput = {
  supabase: SupabaseServerClient
  userId: string
}

export type ResolveSessionClientResult = {
  client: AnthropicStreamClient | null
  keyOrigin: KeyOrigin
}

export function buildUserKeyStreamClient(
  apiKey: string,
): AnthropicStreamClient {
  const anthropic = new Anthropic({ apiKey })
  return {
    async streamCompletion({ system, messages, model, maxTokens }) {
      const stream = anthropic.messages.stream({
        model,
        system,
        messages,
        max_tokens: maxTokens,
      })
      async function* deltas() {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            yield event.delta.text
          }
        }
      }
      const final = (async () => {
        const message = await stream.finalMessage()
        const text = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
        const promptTokens = message.usage?.input_tokens ?? 0
        const completionTokens = message.usage?.output_tokens ?? 0
        const tokens = promptTokens + completionTokens
        return { text, tokens, promptTokens, completionTokens }
      })()
      return { deltas: deltas(), final }
    },
  }
}

export async function resolveSessionClient(
  input: ResolveSessionClientInput,
): Promise<ResolveSessionClientResult> {
  if (getMasterKey() === null) {
    return { client: null, keyOrigin: 'project' }
  }
  let plaintext: string | null
  try {
    plaintext = await getDecryptedKey(input.supabase, input.userId)
  } catch (err) {
    // Tampered ciphertext / migration not applied / supabase hiccup —
    // none of these should break a session that would otherwise work
    // on the project key. Log and fall back.
    logError('byok', err, {
      step: 'resolveSessionClient',
      userId: input.userId,
    })
    return { client: null, keyOrigin: 'project' }
  }
  if (plaintext === null || plaintext.trim() === '') {
    return { client: null, keyOrigin: 'project' }
  }
  return {
    client: buildUserKeyStreamClient(plaintext),
    keyOrigin: 'user',
  }
}
