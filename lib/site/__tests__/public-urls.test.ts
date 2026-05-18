import { describe, expect, it } from 'vitest'
import { PUBLIC_INDEXABLE_PATHS } from '@/lib/site/public-urls'

describe('PUBLIC_INDEXABLE_PATHS', () => {
  it('includes every public-by-design route from bearings', () => {
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/')
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/try')
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/signin')
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/about')
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/about/personas')
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/legal/privacy')
    expect(PUBLIC_INDEXABLE_PATHS).toContain('/legal/terms')
  })

  it('excludes authed and machine-only routes', () => {
    const paths: readonly string[] = PUBLIC_INDEXABLE_PATHS
    expect(paths).not.toContain('/app')
    expect(paths).not.toContain('/app/sessions')
    expect(paths).not.toContain('/auth/callback')
    expect(paths).not.toContain('/diag')
    expect(paths.some((p) => p.startsWith('/api/'))).toBe(false)
  })

  it('every entry is an absolute path starting with /', () => {
    for (const p of PUBLIC_INDEXABLE_PATHS) {
      expect(p.startsWith('/')).toBe(true)
    }
  })
})
