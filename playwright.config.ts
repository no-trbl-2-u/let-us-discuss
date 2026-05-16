import { defineConfig, devices } from '@playwright/test'

const PORT = 4011
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
  webServer: {
    command: `pnpm next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Placeholder Supabase env so the middleware + auth route
      // handlers boot without throwing. The redirect-flow tests
      // never reach the SDK — the middleware short-circuits on
      // anon traffic before calling getUser when env is absent;
      // when env is present (placeholders are fine here), getUser
      // returns null over the dummy URL.
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://e2e.placeholder.test',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
      SUPABASE_URL:
        process.env.SUPABASE_URL ?? 'https://e2e.placeholder.test',
      SUPABASE_ANON_KEY:
        process.env.SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
      // Magic-link e2e walk (e2e/auth-flow.spec.ts) reads these.
      // Unset by default; the spec test-skips when absent.
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL ?? BASE_URL,
      MAGIC_LINK_INBOX_PROVIDER:
        process.env.MAGIC_LINK_INBOX_PROVIDER ?? '',
      MAILOSAUR_API_KEY: process.env.MAILOSAUR_API_KEY ?? '',
      MAILOSAUR_SERVER_ID: process.env.MAILOSAUR_SERVER_ID ?? '',
      MAGIC_LINK_TEST_EMAIL: process.env.MAGIC_LINK_TEST_EMAIL ?? '',
    },
  },
})
