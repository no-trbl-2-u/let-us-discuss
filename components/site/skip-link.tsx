/**
 * SkipLink — visually-hidden anchor that jumps from the very
 * top of the body into the page's <main id="main">.
 * Surfaces as a real-looking accent CTA when keyboard focus
 * lands on it. Rendered as the first child of <body> by
 * app/layout.tsx.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className={[
        // visually hidden by default
        'absolute w-px h-px overflow-hidden whitespace-nowrap',
        'top-0 left-0 [clip:rect(0,0,0,0)]',
        // make it a real button when focused
        'focus-visible:w-auto focus-visible:h-auto focus-visible:overflow-visible',
        'focus-visible:[clip:auto]',
        'focus-visible:fixed focus-visible:top-[var(--space-3)] focus-visible:left-[var(--space-4)]',
        'focus-visible:z-50',
        'focus-visible:bg-[color:var(--accent)] focus-visible:text-[color:var(--accent-ink)]',
        'focus-visible:px-[var(--space-4)] focus-visible:py-[var(--space-2)]',
        'focus-visible:rounded-[var(--radius-sm)]',
        'focus-visible:shadow-[var(--shadow-lifted)]',
        'focus-visible:font-[var(--font-sans)] focus-visible:text-[var(--text-sm)] focus-visible:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]',
      ].join(' ')}
    >
      Skip to main
    </a>
  )
}
