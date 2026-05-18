import { expect, test } from '@playwright/test'

test.describe('sitemap.xml', () => {
  test('returns 200 with a valid sitemap body', async ({ request }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'content-shape check; desktop-only',
    )
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('<loc>')
    expect(body).toContain('/about</loc>')
    expect(body).toContain('/legal/privacy</loc>')
    expect(body).toContain('/legal/terms</loc>')
  })

  test('excludes authed and machine-only routes', async ({
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'content-shape check; desktop-only',
    )
    const res = await request.get('/sitemap.xml')
    const body = await res.text()
    expect(body).not.toMatch(/\/app\b/)
    expect(body).not.toMatch(/\/auth\/callback/)
    expect(body).not.toMatch(/\/api\//)
  })
})
