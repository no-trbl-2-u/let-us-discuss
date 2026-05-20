import { describe, expect, it } from 'vitest'
import { isAuthedRoute, isPublicRoute } from '@/lib/auth/route-table'

describe('isPublicRoute', () => {
  it.each([
    '/',
    '/signin',
    '/signin/anything',
    '/try',
    '/about',
    '/about/personas',
    '/legal',
    '/legal/privacy',
    '/legal/terms',
    '/auth/callback',
    '/api/health',
    '/diag',
  ])('returns true for %s', (path) => {
    expect(isPublicRoute(path)).toBe(true)
  })

  it.each(['/app', '/app/sessions', '/app/sessions/abc'])(
    'returns false for %s',
    (path) => {
      expect(isPublicRoute(path)).toBe(false)
    },
  )
})

describe('isAuthedRoute', () => {
  it.each([
    '/app',
    '/app/sessions',
    '/app/sessions/abc/transcript',
    '/admin',
    '/admin/anything',
  ])('returns true for %s', (path) => {
    expect(isAuthedRoute(path)).toBe(true)
  })

  it.each(['/', '/signin', '/api/health', '/diag'])(
    'returns false for %s',
    (path) => {
      expect(isAuthedRoute(path)).toBe(false)
    },
  )
})
