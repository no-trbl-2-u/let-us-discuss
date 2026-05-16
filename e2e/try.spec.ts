import { expect, test } from '@playwright/test'

test.describe('/try anonymous demo', () => {
  test('renders the demo board with the Start button disabled until a pitch is typed', async ({
    page,
  }) => {
    await page.goto('/try')
    await expect(
      page.getByRole('heading', { level: 1, name: /see the shape/i }),
    ).toBeVisible()
    await expect(page.getByLabel(/demo shelf/i)).toBeVisible()
    const start = page.getByRole('button', { name: /start demo/i })
    await expect(start).toBeDisabled()

    await page.getByRole('textbox').fill('a small idea')
    await expect(start).toBeEnabled()
  })

  test('skip animation jumps to artifact previews and CTA', async ({ page }) => {
    await page.goto('/try')
    await page.getByRole('textbox').fill('a small idea')
    await page.getByRole('button', { name: /start demo/i }).click()
    await page.getByRole('button', { name: /skip animation/i }).click()

    // All three artifact previews appear (titles are H3s).
    await expect(page.getByRole('heading', { level: 3, name: 'spec.md' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Executive summary' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Out-of-scope call-outs' })).toBeVisible()

    // Three "Sign in to download" links, each to /signin?next=/app.
    const ctas = page.getByRole('link', { name: /sign in to download/i })
    await expect(ctas).toHaveCount(3)
    await expect(ctas.first()).toHaveAttribute('href', '/signin?next=/app')

    // The sign-in CTA below the artifacts is also present.
    await expect(
      page.getByRole('button', { name: /sign in to continue/i }),
    ).toBeVisible()
  })

  test('375px viewport reflows without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/try')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('reload after completing the demo lands on demo-already-used', async ({
    page,
  }) => {
    await page.goto('/try')
    await page.getByRole('textbox').fill('a small idea')
    await page.getByRole('button', { name: /start demo/i }).click()
    await page.getByRole('button', { name: /skip animation/i }).click()
    await expect(
      page.getByRole('heading', { level: 3, name: 'spec.md' }),
    ).toBeVisible()

    await page.reload()
    await expect(page.getByText(/already run the demo/i)).toBeVisible()
  })
})
