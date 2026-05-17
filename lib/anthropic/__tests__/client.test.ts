import {
  AnthropicConfigError,
  getAnthropicClient,
} from '@/lib/anthropic/client'
import { describe, expect, it } from 'vitest'

function env(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { ...process.env, ...extra }
}

function envWithout(key: string): NodeJS.ProcessEnv {
  const { [key]: _omit, ...rest } = process.env
  return rest as NodeJS.ProcessEnv
}

describe('getAnthropicClient', () => {
  it('throws AnthropicConfigError when ANTHROPIC_API_KEY is unset', () => {
    expect(() => getAnthropicClient(envWithout('ANTHROPIC_API_KEY'))).toThrow(
      AnthropicConfigError,
    )
  })

  it('throws AnthropicConfigError when the key is blank whitespace', () => {
    expect(() => getAnthropicClient(env({ ANTHROPIC_API_KEY: '   ' }))).toThrow(
      AnthropicConfigError,
    )
  })

  it('returns the client with the configured key + default model when key is set', () => {
    const { ANTHROPIC_MODEL: _ignore, ...base } = process.env
    const client = getAnthropicClient({
      ...(base as NodeJS.ProcessEnv),
      ANTHROPIC_API_KEY: 'sk-test ',
    })
    expect(client.apiKey).toBe('sk-test')
    expect(client.model).toBe('claude-opus-4-7')
  })

  it('honors ANTHROPIC_MODEL override', () => {
    const client = getAnthropicClient(
      env({
        ANTHROPIC_API_KEY: 'sk-test',
        ANTHROPIC_MODEL: 'claude-sonnet-4-6',
      }),
    )
    expect(client.model).toBe('claude-sonnet-4-6')
  })
})

describe('AnthropicConfigError', () => {
  it('carries the anthropic-config code', () => {
    const err = new AnthropicConfigError('nope')
    expect(err.name).toBe('AnthropicConfigError')
    expect(err.code).toBe('anthropic-config')
  })
})
