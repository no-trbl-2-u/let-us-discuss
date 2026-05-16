import { expect, test } from '@playwright/test'
import { magicLinkInboxFromEnv } from './helpers/magic-link-inbox'

const inbox = magicLinkInboxFromEnv()
const testEmail = process.env.MAGIC_LINK_TEST_EMAIL ?? ''

test('magic-link sign-in walks /signin → inbox → /app', async ({ page }) => {
  test.skip(
    !inbox || !testEmail,
    'Set MAGIC_LINK_INBOX_PROVIDER + MAGIC_LINK_TEST_EMAIL (and the provider credentials) to walk this spec. See plan/AUDIT.md [needs-e2e] Magic-link sign-in walk.',
  )
  if (!inbox || !testEmail) return // satisfies the type narrower

  // 1. Submit the email at /signin.
  await page.goto('/signin')
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByRole('button', { name: /send the link/i }).click()
  await expect(page.getByText(/check your inbox/i)).toBeVisible()

  // 2. Poll the configured inbox for the magic link.
  const magicLinkUrl = await inbox.waitForMagicLink({
    to: testEmail,
    timeoutMs: 90_000,
  })

  // 3. Follow the link; Supabase /auth/callback exchanges the code
  //    and redirects to /app.
  await page.goto(magicLinkUrl)
  await expect(page).toHaveURL(/\/app(\b|\/|$)/)

  // 4. Authed: the placeholder page renders the user's email.
  await expect(page.getByText(testEmail)).toBeVisible()
})
