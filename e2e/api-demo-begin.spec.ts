import { expect, test } from '@playwright/test'

test('POST /api/demo/begin returns a documented body shape', async ({
  request,
}) => {
  const res = await request.post('/api/demo/begin', { data: {} })
  // Either: 200 ok=true with used/limit/source, or 429 demo-quota with
  // used/limit. Both flavors are valid documented outcomes; test asserts
  // the body shape rather than the exact status.
  const body = await res.json()
  if (res.status() === 200) {
    expect(body.ok).toBe(true)
    expect(typeof body.limit).toBe('number')
  } else if (res.status() === 429) {
    expect(body.code).toBe('demo-quota')
    expect(typeof body.used).toBe('number')
    expect(typeof body.limit).toBe('number')
  } else {
    throw new Error(`unexpected status ${res.status()}`)
  }
})
