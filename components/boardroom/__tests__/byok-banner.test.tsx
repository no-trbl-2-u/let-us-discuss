import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ByokBanner } from '@/components/boardroom/byok-banner'
import { BYOK_BANNER_TEXT } from '@/lib/anthropic/user-key-client'

describe('ByokBanner', () => {
  it('returns null when visible=false', () => {
    const { container } = render(<ByokBanner visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the locked copy when visible=true', () => {
    render(<ByokBanner visible={true} />)
    expect(screen.getByTestId('byok-banner')).toBeInTheDocument()
    expect(screen.getByText(BYOK_BANNER_TEXT)).toBeInTheDocument()
  })

  it('has role=status for assistive tech', () => {
    render(<ByokBanner visible={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
