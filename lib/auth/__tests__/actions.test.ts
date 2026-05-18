import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOtp = vi.fn()
const signOut = vi.fn()
const deleteUser = vi.fn()
const getUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { signInWithOtp, signOut, getUser },
  }),
  createServiceClient: () => ({
    auth: { admin: { deleteUser } },
  }),
}))

vi.mock('@/lib/supabase/auth', () => ({
  getCurrentUser: async () => {
    const { data } = await getUser()
    return data?.user ?? null
  },
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

describe('signInWithOtpAction', () => {
  const originalEnv = process.env

  beforeEach(() => {
    signInWithOtp.mockReset()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: 'https://example.test',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns ok with redirect on valid email', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    const { signInWithOtpAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', '  Alice@example.com  ')
    const result = await signInWithOtpAction(fd)
    expect(result).toEqual({
      ok: true,
      redirectTo: '/signin?sent=1&next=%2Fapp',
    })
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'alice@example.com',
      options: {
        emailRedirectTo: 'https://example.test/auth/callback?next=%2Fapp',
      },
    })
  })

  it('routes ?next through safeNextPath', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    const { signInWithOtpAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', 'a@b.co')
    fd.set('next', '//evil.test')
    const result = await signInWithOtpAction(fd)
    expect(result).toEqual({
      ok: true,
      redirectTo: '/signin?sent=1&next=%2Fapp',
    })
  })

  it('returns error on invalid email', async () => {
    const { signInWithOtpAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', 'not-an-email')
    const result = await signInWithOtpAction(fd)
    expect(result).toEqual({
      ok: false,
      error: 'Enter a valid email address.',
      email: 'not-an-email',
    })
    expect(signInWithOtp).not.toHaveBeenCalled()
  })

  it('surfaces Supabase errors', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'rate limit' } })
    const { signInWithOtpAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', 'a@b.co')
    const result = await signInWithOtpAction(fd)
    expect(result).toEqual({
      ok: false,
      error: 'rate limit',
      email: 'a@b.co',
    })
  })
})

describe('signOutAction', () => {
  it('signs out and redirects to /', async () => {
    signOut.mockResolvedValue({ error: null })
    const { signOutAction } = await import('@/lib/auth/actions')
    await expect(signOutAction()).rejects.toThrow('NEXT_REDIRECT:/')
    expect(signOut).toHaveBeenCalledOnce()
  })
})

describe('deleteAccountAction', () => {
  beforeEach(() => {
    signOut.mockReset()
    deleteUser.mockReset()
    getUser.mockReset()
  })

  it('rejects when the confirm field is empty', async () => {
    const { deleteAccountAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    const result = await deleteAccountAction(fd)
    expect(result).toEqual({ ok: false, error: 'Type delete to confirm.' })
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('rejects when the confirm field is wrong', async () => {
    const { deleteAccountAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('confirm', 'yes')
    const result = await deleteAccountAction(fd)
    expect(result).toEqual({ ok: false, error: 'Type delete to confirm.' })
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('rejects when the session has expired (no user)', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { deleteAccountAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('confirm', 'delete')
    const result = await deleteAccountAction(fd)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/sign in expired/i)
    }
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('surfaces a Supabase admin error', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    deleteUser.mockResolvedValue({
      error: { message: 'admin delete failed' },
    })
    const { deleteAccountAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('confirm', 'delete')
    const result = await deleteAccountAction(fd)
    expect(result).toEqual({ ok: false, error: 'admin delete failed' })
    expect(signOut).not.toHaveBeenCalled()
  })

  it('deletes the user via the admin API, signs out, and redirects', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    deleteUser.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
    const { deleteAccountAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('confirm', 'delete')
    const result = await deleteAccountAction(fd)
    expect(result).toEqual({ ok: true, redirectTo: '/?account=deleted' })
    expect(deleteUser).toHaveBeenCalledWith('user-1')
    expect(signOut).toHaveBeenCalledOnce()
  })
})
