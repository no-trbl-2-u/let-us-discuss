import { Nav } from '@/design/primitives/nav'

const ITEMS = [
  { href: '/about/personas', label: 'Personas' },
] as const

export function Header() {
  return (
    <Nav
      items={[...ITEMS]}
      cta={{ href: '/signin', label: 'Sign in' }}
    />
  )
}
