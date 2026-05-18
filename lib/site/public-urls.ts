/**
 * Indexable public URLs. Drawn from plan/bearings.md
 * "URL contract" minus the routes that should not be in
 * search results:
 *   - /app/* (authed only)
 *   - /api/* (programmatic; not for users)
 *   - /auth/callback (single-use Supabase handler)
 *   - /diag (dev/operator probe)
 *
 * The URL_CONTRACT walker in e2e/url-contract.ts asserts
 * shipped reality; this list asserts indexability intent.
 */
export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/try',
  '/signin',
  '/about',
  '/about/personas',
  '/legal/privacy',
  '/legal/terms',
] as const

export type PublicIndexablePath = (typeof PUBLIC_INDEXABLE_PATHS)[number]
