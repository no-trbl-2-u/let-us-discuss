import { expect, test } from '@playwright/test'

test.describe('skip link', () => {
  test('first Tab focuses the skip link; Enter jumps to #main', async ({
    page,
  }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toHaveAttribute('href', '#main')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })

  test('main element exists with id="main"', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main#main')
    await expect(main).toBeVisible()
  })
})
