import { expect, test } from '@playwright/test'

test('signin page renders the magic-link form', async ({ page }) => {
  await page.goto('/signin')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/sign in/i)
  await expect(page.getByLabel(/email/i)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /send magic link/i }),
  ).toBeVisible()
})

test('signin shows the confirmation state when sent=1', async ({ page }) => {
  await page.goto('/signin?sent=1')
  await expect(page.getByText(/check your email/i)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /send magic link/i }),
  ).toHaveCount(0)
})
