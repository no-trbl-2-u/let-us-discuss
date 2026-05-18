import { expect, test } from '@playwright/test'

test.describe('about + legal routes resolve (phase 12)', () => {
  test('/about returns 200 with About boardroom H1', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    const res = await page.goto('/about')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /about boardroom/i,
    )
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })

  test('/legal/privacy returns 200 with Privacy H1', async ({ page }) => {
    const res = await page.goto('/legal/privacy')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /^privacy/i,
    )
  })

  test('/legal/terms returns 200 with Terms of use H1', async ({ page }) => {
    const res = await page.goto('/legal/terms')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /terms of use/i,
    )
  })

  test('footer Privacy + Terms links resolve from the landing page', async ({
    page,
  }) => {
    await page.goto('/')
    const privacy = page.getByRole('contentinfo').getByRole('link', {
      name: /privacy/i,
    })
    const terms = page.getByRole('contentinfo').getByRole('link', {
      name: /terms/i,
    })
    await expect(privacy).toHaveAttribute('href', '/legal/privacy')
    await expect(terms).toHaveAttribute('href', '/legal/terms')
  })
})
