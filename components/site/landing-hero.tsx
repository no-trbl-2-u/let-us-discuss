export const HERO_HEADLINE =
  'Turn a loose pitch into a concrete spec.'

export const HERO_SUBHEAD =
  'Drag a few AI personas to the table, hand them your idea, and walk out with a usable artifact — no prompt engineering required.'

export function LandingHero() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-[2fr_1fr] md:items-center">
        <div className="space-y-6">
          <h1 className="font-sans text-4xl font-semibold tracking-tight md:text-5xl">
            {HERO_HEADLINE}
          </h1>
          <p className="font-serif text-lg text-ink/80 md:text-xl">
            {HERO_SUBHEAD}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              aria-disabled="true"
              disabled
              title="Coming in v1 — sign up to be notified."
              className="inline-flex cursor-not-allowed items-center rounded-md bg-accent/30 px-5 py-3 font-sans text-sm font-medium text-ink/60"
            >
              Try it (coming soon)
            </button>
            <span className="font-sans text-sm text-ink/60">
              v1 in build — substrate landed, gameplay shipping in phases.
            </span>
          </div>
        </div>
        <aside className="rounded-lg border border-ink/10 bg-ink/[0.02] p-6 font-sans text-sm text-ink/70">
          <p className="mb-3 font-semibold text-ink/90">What this is</p>
          <p>
            A short, opinionated board-room conversation between AI personas.
            You bring the pitch; they leave a spec, an executive summary, and
            the open questions worth chasing.
          </p>
        </aside>
      </div>
    </section>
  )
}
