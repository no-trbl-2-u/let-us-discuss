import { expect, test } from '@playwright/test'

test('POST /api/sessions is reachable and returns 401 anonymously', async ({
  request,
}) => {
  const res = await request.post('/api/sessions', {
    data: {
      pitch: 'a short pitch',
      personaSlugs: ['product-lead', 'skeptical-engineer'],
      templateSlug: 'pitch-to-spec',
    },
  })
  // Two acceptable outcomes: the route is wired and rejects unauthed (401)
  // OR the build did not include the route (404). The test asserts the
  // happy state — wired + rejects anon.
  expect(res.status()).toBe(401)
})

test('POST /api/sessions/[id]/answer returns 401 anonymously', async ({
  request,
}) => {
  const res = await request.post(
    '/api/sessions/11111111-2222-4333-8444-555555555555/answer',
    {
      data: { body: 'short answer' },
    },
  )
  expect(res.status()).toBe(401)
})
