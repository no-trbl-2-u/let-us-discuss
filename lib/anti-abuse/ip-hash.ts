import { createHash } from 'node:crypto'

// SHA-256(salt + ip), first 32 hex chars. Header order matches Vercel's
// default proxy chain: x-forwarded-for first comma-segment, then x-real-ip.
// When neither header carries a usable value the helper returns the literal
// 'unresolved' so the audit row still exists but doesn't claim a hash.

let warnedUnsetSalt = false

function warnUnsetSaltOnce(): void {
  if (warnedUnsetSalt) return
  warnedUnsetSalt = true
  // biome-ignore lint/suspicious/noConsole: intentional startup warning
  console.warn(
    '[anti-abuse] IP_HASH_SALT is unset — hashing without salt. Set IP_HASH_SALT in production.',
  )
}

export function _resetWarnedForTests(): void {
  warnedUnsetSalt = false
}

export function readIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real
  return null
}

export function hashIp(
  req: Request | Headers,
  source: 'env' | string = 'env',
): string {
  const headers = req instanceof Headers ? req : req.headers
  const ip = readIp(headers)
  if (!ip) return 'unresolved'
  const salt =
    source === 'env' ? (process.env.IP_HASH_SALT?.trim() ?? '') : source
  if (source === 'env' && salt === '') warnUnsetSaltOnce()
  const hash = createHash('sha256').update(salt).update(ip).digest('hex')
  return hash.slice(0, 32)
}
