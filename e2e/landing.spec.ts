import { expect, test } from '@playwright/test'

test.describe('landing', () => {
  test('renders the pitch headline as H1 with no console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')

    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('pitch')

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })

  test('Try-it CTA is aria-disabled', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('button', { name: /try it/i })
    await expect(cta).toHaveAttribute('aria-disabled', 'true')
  })

  test('375px viewport reflows without horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    const h1 = page.locator('h1').first()
    await expect(h1).toBeInViewport()
  })
})
