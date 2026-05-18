import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from '@/app/about/page'

describe('/about page', () => {
  it('renders the H1', () => {
    render(AboutPage())
    expect(
      screen.getByRole('heading', { level: 1, name: /about boardroom/i }),
    ).toBeInTheDocument()
  })

  it('renders every locked H2 section', () => {
    render(AboutPage())
    expect(
      screen.getByRole('heading', { level: 2, name: /who it's for/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /what you get/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /what it isn't/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /try it/i }),
    ).toBeInTheDocument()
  })

  it('does NOT render the "Built with nexus" build-process footnote (closed pass 5 critique)', () => {
    render(AboutPage())
    expect(screen.queryByText(/built with/i)).toBeNull()
    expect(screen.queryByRole('link', { name: /^nexus$/i })).toBeNull()
  })

  it('links to /try, /signin, and /about/personas in the body', () => {
    render(AboutPage())
    expect(
      screen.getByRole('link', { name: /run an anonymous demo/i }),
    ).toHaveAttribute('href', '/try')
    expect(screen.getByRole('link', { name: /^sign in$/i })).toHaveAttribute(
      'href',
      '/signin',
    )
    expect(
      screen.getByRole('link', { name: /persona library/i }),
    ).toHaveAttribute('href', '/about/personas')
  })
})
