import { checkAndBumpDemoLimit } from '@/lib/anti-abuse/demo-rate-limit'
import { hashIp } from '@/lib/anti-abuse/ip-hash'
import { MAX_DEMO_SESSIONS_PER_IP_PER_DAY } from '@/lib/limits'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Anonymous public endpoint. /try calls this before kicking the canned
// demo. Per the brief: fail-open when the IP is unresolvable (the
// sessionStorage cap already bounds abuse from a single browser).

export async function POST(req: NextRequest) {
  const ipHash = hashIp(req)
  if (ipHash === 'unresolved') {
    return Response.json(
      {
        ok: true,
        used: 0,
        limit: MAX_DEMO_SESSIONS_PER_IP_PER_DAY,
        source: 'unresolved',
      },
      { status: 200 },
    )
  }

  let result
  try {
    const supabase = createServiceClient()
    result = await checkAndBumpDemoLimit(supabase, ipHash)
  } catch {
    // Fail-open: counting infra hiccup should not block a legitimate demo.
    return Response.json(
      {
        ok: true,
        used: 0,
        limit: MAX_DEMO_SESSIONS_PER_IP_PER_DAY,
        source: 'error',
      },
      { status: 200 },
    )
  }

  if (!result.allowed) {
    return Response.json(
      { code: 'demo-quota', used: result.used, limit: result.limit },
      { status: 429 },
    )
  }
  return Response.json(
    { ok: true, used: result.used, limit: result.limit },
    { status: 200 },
  )
}
