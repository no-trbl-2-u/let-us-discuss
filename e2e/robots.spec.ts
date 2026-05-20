import { expect, test } from '@playwright/test'

test.describe('robots.txt', () => {
  test('returns 200 with the expected allow + disallow + sitemap', async ({
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'content-shape check; desktop-only',
    )
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/User-Agent:\s*\*/i)
    expect(body).toMatch(/Allow:\s*\//)
    expect(body).toMatch(/Disallow:\s*\/app\//)
    expect(body).toMatch(/Disallow:\s*\/admin/)
    expect(body).toMatch(/Disallow:\s*\/api\//)
    expect(body).toMatch(/Disallow:\s*\/auth\/callback/)
    expect(body).toMatch(/Disallow:\s*\/diag/)
    expect(body).toMatch(/Sitemap:\s*https?:\/\/.+\/sitemap\.xml/)
  })
})
