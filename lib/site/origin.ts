/**
 * Origin used by metadataBase, sitemap, robots, OG image
 * alt text — anything that needs an absolute URL.
 *
 * Precedence:
 *   1. NEXT_PUBLIC_SITE_URL (set in Vercel env + Playwright)
 *   2. The canonical production alias from plan/bearings.md
 *
 * Trims a trailing slash so callers can safely concat paths.
 */
const FALLBACK_ORIGIN = 'https://let-us-discuss-ai.vercel.app'

export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_ORIGIN
  return raw.replace(/\/+$/, '')
}
