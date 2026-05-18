import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from '@/design/primitives/skeleton'

describe('Skeleton primitive', () => {
  it('renders the data-skeleton attribute', () => {
    const { container } = render(<Skeleton />)
    const el = container.querySelector('[data-skeleton]')
    expect(el).not.toBeNull()
  })

  it('passes through className', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />)
    const el = container.querySelector('[data-skeleton]')
    expect(el?.className).toMatch(/h-10/)
    expect(el?.className).toMatch(/w-20/)
  })

  it('is aria-hidden so screen readers skip it', () => {
    const { container } = render(<Skeleton />)
    const el = container.querySelector('[data-skeleton]')
    expect(el?.getAttribute('aria-hidden')).toBe('true')
  })

  it('uses motion-safe:animate-pulse so reduced-motion users get a static block', () => {
    const { container } = render(<Skeleton />)
    const el = container.querySelector('[data-skeleton]')
    expect(el?.className).toMatch(/motion-safe:animate-pulse/)
  })
})
