export const PUBLIC_ROUTE_PREFIXES = [
  '/signin',
  '/try',
  '/about',
  '/legal',
  '/auth/callback',
  '/api/health',
  '/diag',
] as const

export const AUTHED_ROUTE_PREFIXES = ['/app'] as const

export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true
  }
  return false
}

export function isAuthedRoute(pathname: string): boolean {
  for (const prefix of AUTHED_ROUTE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true
  }
  return false
}
