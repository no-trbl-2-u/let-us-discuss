export type RequiredEnvKey =
  | 'SUPABASE_URL'
  | 'SUPABASE_ANON_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'

export type MissingEnv = { ok: false; reason: `missing-env: ${RequiredEnvKey}` }

export type EnvSource = Record<string, string | undefined>

export function readEnv(
  key: RequiredEnvKey,
  source: EnvSource = process.env,
): string | MissingEnv {
  const value = source[key]
  if (typeof value !== 'string' || value.trim() === '') {
    return { ok: false, reason: `missing-env: ${key}` }
  }
  return value.trim()
}

export function requireEnv(
  key: RequiredEnvKey,
  source: EnvSource = process.env,
): string {
  const value = readEnv(key, source)
  if (typeof value === 'string') return value
  throw new Error(value.reason)
}
