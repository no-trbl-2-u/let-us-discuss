import { expect, test } from '@playwright/test'

test('GET /app unauthenticated redirects to /signin with next', async ({
  page,
}) => {
  const response = await page.goto('/app')
  expect(response).not.toBeNull()
  // After all redirects, we should land on /signin.
  expect(page.url()).toMatch(/\/signin\?next=%2Fapp/)
  await expect(
    page.getByRole('heading', { level: 2, name: /sign in/i }),
  ).toBeVisible()
})
