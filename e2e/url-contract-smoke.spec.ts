import { expect, test } from '@playwright/test'
import { URL_CONTRACT } from './url-contract'

// Desktop-only contract test: assert every route returns < 500
// and the redirect targets / status families are correct.
// Use Playwright's request fixture (not page.goto) so all 16 routes
// run in parallel without spinning up browser contexts per nav.

test.describe('URL contract smoke (phase 13)', () => {
  for (const entry of URL_CONTRACT) {
    test(`${entry.method} ${entry.url} — ${entry.label}`, async ({
      request,
    }, testInfo) => {
      // Contract test: route-availability is identical between
      // desktop and mobile. Run on desktop only to keep the gate
      // fast (cuts 32 runs to 16).
      test.skip(
        testInfo.project.name !== 'desktop',
        'desktop-only contract test',
      )
      const res =
        entry.method === 'GET'
          ? await request.get(entry.url, { maxRedirects: 0 })
          : await request.post(entry.url, {
              data: entry.body ?? {},
              maxRedirects: 0,
            })

      const status = res.status()

      // The headline assertion every route must satisfy: no 500-class
      // errors. Soft so a single break surfaces every other break in
      // the same run instead of stopping at the first.
      expect
        .soft(status, `${entry.label} returned ${status}`)
        .toBeLessThan(500)

      switch (entry.expect) {
        case 'ok':
          expect.soft(status).toBe(200)
          break
        case 'redirect-to-signin-missing-code': {
          expect.soft(status).toBeGreaterThanOrEqual(300)
          expect.soft(status).toBeLessThan(400)
          const location = res.headers().location ?? ''
          expect.soft(location).toContain('/signin')
          expect.soft(location).toContain('error=missing-code')
          break
        }
        case 'redirect-to-signin-with-next': {
          expect.soft(status).toBeGreaterThanOrEqual(300)
          expect.soft(status).toBeLessThan(400)
          const location = res.headers().location ?? ''
          expect.soft(location).toContain('/signin')
          if (entry.next) {
            expect
              .soft(location)
              .toContain(`next=${encodeURIComponent(entry.next)}`)
          }
          break
        }
        case 'redirect-to-signin': {
          expect.soft(status).toBeGreaterThanOrEqual(300)
          expect.soft(status).toBeLessThan(400)
          const location = res.headers().location ?? ''
          expect.soft(location).toContain('/signin')
          break
        }
        case 'unauthorized':
          expect.soft(status).toBe(401)
          break
        case 'non-server-error':
          // Already covered by the headline < 500 assertion; this
          // branch exists so the switch is exhaustive.
          break
      }
    })
  }
})
