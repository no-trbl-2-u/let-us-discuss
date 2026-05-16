import { expect, test } from '@playwright/test'

test('/about/personas renders the persona library', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/about/personas')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /personas/i,
  )
  await expect(
    page.getByRole('heading', { level: 2, name: 'Product lead' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Skeptical engineer' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Growth voice' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: 'End-user proxy' }),
  ).toBeVisible()

  expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
})

test('/about/personas reflows at 375px without horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/about/personas')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})
