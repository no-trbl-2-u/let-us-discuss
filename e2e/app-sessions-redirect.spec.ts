import { expect, test } from '@playwright/test'

test('GET /app/sessions unauthenticated redirects to /signin with next', async ({
  page,
}) => {
  const response = await page.goto('/app/sessions')
  expect(response).not.toBeNull()
  // Either: server redirected to /signin (most likely) or a client-side
  // bounce landed us there. Assert by URL + content.
  expect(page.url()).toContain('/signin')
  expect(page.url()).toContain('next=%2Fapp%2Fsessions')
})
