import { expect, test } from '@playwright/test'

test.describe('app/not-found', () => {
  test('GET /this-url-does-not-exist returns 404 with voice-matched H1', async ({
    page,
  }) => {
    const res = await page.goto('/this-url-does-not-exist')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /not found\.?/i,
    )
  })

  test('the 404 page exposes a Go to the landing page CTA', async ({
    page,
  }) => {
    await page.goto('/this-url-does-not-exist')
    const cta = page.getByRole('link', { name: /go to the landing page/i })
    await expect(cta).toHaveAttribute('href', '/')
  })

  test('document.title is "Not found — boardroom", not the landing default', async ({
    page,
  }) => {
    await page.goto('/this-url-does-not-exist')
    await expect(page).toHaveTitle(/not found — boardroom/i)
  })
})
