import { readEnv, type EnvSource } from './env'

export type DiagOk = {
  ok: true
  value: number
  env: { url: 'set'; anon: 'set'; service: 'set' }
}

export type DiagFail = {
  ok: false
  reason: string
}

export type DiagResult = DiagOk | DiagFail

type ProbeClient = {
  auth: { getSession: () => Promise<{ error: { message: string } | null }> }
}

type DiagDeps = {
  env?: EnvSource
  makeClient?: () => ProbeClient
}

export async function runDiagProbe({
  env = process.env,
  makeClient,
}: DiagDeps = {}): Promise<DiagResult> {
  const url = readEnv('SUPABASE_URL', env)
  if (typeof url !== 'string') return url
  const anon = readEnv('SUPABASE_ANON_KEY', env)
  if (typeof anon !== 'string') return anon
  const service = readEnv('SUPABASE_SERVICE_ROLE_KEY', env)
  if (typeof service !== 'string') return service

  const client = makeClient ? makeClient() : await defaultClient()
  try {
    const { error } = await client.auth.getSession()
    if (error) return { ok: false, reason: `probe-failed: ${error.message}` }
    return {
      ok: true,
      value: 1,
      env: { url: 'set', anon: 'set', service: 'set' },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: `probe-threw: ${message}` }
  }
}

async function defaultClient(): Promise<ProbeClient> {
  const { createServiceClient } = await import('./server')
  return createServiceClient() as unknown as ProbeClient
}
