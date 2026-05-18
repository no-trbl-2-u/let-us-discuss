import { expect, test } from '@playwright/test'

test.describe('og + icon images', () => {
  test('/opengraph-image returns a PNG with 200', async ({
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'content-shape check; desktop-only',
    )
    const res = await request.get('/opengraph-image')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/image\/png/i)
    const body = await res.body()
    expect(body.length).toBeGreaterThan(2000)
  })

  test('/icon returns a small PNG with 200', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only')
    const res = await request.get('/icon')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/image\/png/i)
  })

  test('/apple-icon returns a PNG with 200', async ({
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only')
    const res = await request.get('/apple-icon')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/image\/png/i)
  })

  test('landing page exposes the og image as a meta tag', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only')
    await page.goto('/')
    const og = page.locator('meta[property="og:image"]').first()
    const href = await og.getAttribute('content')
    expect(href).toMatch(/opengraph-image/)
  })
})
