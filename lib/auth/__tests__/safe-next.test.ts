import { describe, expect, it } from 'vitest'
import { safeNextPath } from '@/lib/auth/safe-next'

describe('safeNextPath', () => {
  it.each([
    ['/app', '/app'],
    ['/app/sessions', '/app/sessions'],
    ['/about', '/about'],
  ])('accepts %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })

  it.each([
    ['//evil.example.com', '/app'],
    ['https://evil.example.com', '/app'],
    ['/\\evil', '/app'],
    ['file:///etc/passwd', '/app'],
    ['../app', '/app'],
    ['/app/../../etc', '/app'],
    ['', '/app'],
    [null, '/app'],
    [undefined, '/app'],
  ])('rejects %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })
})
