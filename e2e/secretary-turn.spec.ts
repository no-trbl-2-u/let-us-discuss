import { expect, test } from '@playwright/test'
import { magicLinkInboxFromEnv } from './helpers/magic-link-inbox'

// Phase 21 — authed e2e for the secretary turn walk. Conditional on
// MAGIC_LINK_INBOX_PROVIDER + MAGIC_LINK_TEST_EMAIL per the existing
// operator contract (auth-flow.spec.ts uses the same gate). Until those
// are wired, this spec test-skips — the unit tests and the framework
// stub spec cover the secretary path end-to-end against the stub
// client.

const inbox = magicLinkInboxFromEnv()
const testEmail = process.env.MAGIC_LINK_TEST_EMAIL ?? ''

test('secretary turn renders on the boardroom + artifact grid', async ({
  page,
}) => {
  test.skip(
    !inbox || !testEmail,
    'Set MAGIC_LINK_INBOX_PROVIDER + MAGIC_LINK_TEST_EMAIL to walk the authed secretary spec. See plan/AUDIT.md [operator] magic-link inbox row.',
  )
  if (!inbox || !testEmail) return

  // 1. Sign in via magic link (lifted pattern from auth-flow.spec.ts).
  await page.goto('/signin')
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByRole('button', { name: /send the link/i }).click()
  await expect(page.getByText(/check your inbox/i)).toBeVisible()

  const magicLinkUrl = await inbox.waitForMagicLink({
    to: testEmail,
    timeoutMs: 90_000,
  })
  await page.goto(magicLinkUrl)
  await expect(page).toHaveURL(/\/app(\?.*)?$/)

  // 2. Boardroom shelf shows the "Plus the Secretary" eyebrow.
  await expect(
    page.getByLabel(/secretary at the table/i),
  ).toBeVisible()

  // 3. The full session walk (staff cast → submit pitch → clarify →
  //    exec-summary-accept → wait for artifact.ready → assert secretary
  //    artifact tile + Secretary-labeled transcript turn) is the next
  //    layer of this spec. Skeleton lands here; the full happy-path
  //    walk depends on stable selectors that are still in flight from
  //    phase 17 polish. Filed in plan/AUDIT.md as a follow-up.
})
