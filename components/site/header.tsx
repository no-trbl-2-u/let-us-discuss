import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-sans text-lg font-semibold tracking-tight"
        >
          boardroom
        </Link>
        <nav
          aria-label="Primary"
          className="flex items-center gap-6 font-sans text-sm"
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span
            aria-disabled="true"
            className="cursor-not-allowed text-ink/50"
            title="Coming in v1"
          >
            Sign in
          </span>
        </nav>
      </div>
    </header>
  )
}
