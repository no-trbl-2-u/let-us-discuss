import { describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser },
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

describe('getCurrentUser', () => {
  it('returns the user when SDK resolves with one', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'a@b.co' } },
      error: null,
    })
    const { getCurrentUser } = await import('@/lib/supabase/auth')
    const user = await getCurrentUser()
    expect(user).toEqual({ id: 'u-1', email: 'a@b.co' })
  })

  it('returns null when SDK reports no session', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    const { getCurrentUser } = await import('@/lib/supabase/auth')
    expect(await getCurrentUser()).toBeNull()
  })

  it('returns null when SDK errors', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'jwt expired' },
    })
    const { getCurrentUser } = await import('@/lib/supabase/auth')
    expect(await getCurrentUser()).toBeNull()
  })
})

describe('requireUser', () => {
  it('redirects to /signin?next=/app when no user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { requireUser } = await import('@/lib/supabase/auth')
    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT:/signin?next=/app')
  })

  it('returns the user when one exists', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u-2', email: 'c@d.co' } },
      error: null,
    })
    const { requireUser } = await import('@/lib/supabase/auth')
    expect(await requireUser()).toEqual({ id: 'u-2', email: 'c@d.co' })
  })
})
