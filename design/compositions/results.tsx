// design/compositions/results.tsx
// ---------------------------------------------------------------------------
// Results — the final-output screen.
//
// Header reminds the user what just happened (one line, no celebration
// language). Three artifact tiles sit on a row. Below them: a collapsed
// transcript link and a "Start another session" CTA.
// ---------------------------------------------------------------------------

import { Nav } from "../primitives/nav";
import { Heading } from "../primitives/heading";
import { ArtifactTile } from "../primitives/artifact-tile";
import { Button } from "../primitives/button";
import { Link } from "../primitives/link";

export default function ResultsPage() {
  return (
    <>
      <Nav items={[{ href: "/app/sessions", label: "Past sessions" }]} cta={{ href: "/app", label: "MO" }} />

      <main className="mx-auto max-w-[1100px] px-[var(--space-7)] py-[var(--space-8)]">
        <header className="mb-[var(--space-7)]">
          <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-3)]">
            session · 2026-05-16 · 22 minutes · 47,830 tokens
          </p>
          <Heading level={1} className="max-w-[28ch]">
            Three artifacts. Take them and go.
          </Heading>
          <p className="mt-[var(--space-4)] max-w-[58ch] font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)]">
            Four personas conferred for twenty-two minutes on your indie-dev
            accountability pitch. Here is the spec, the exec summary, and
            the call-outs they intentionally left out of scope.
          </p>
        </header>

        <section className="grid grid-cols-12 gap-[var(--space-5)] mb-[var(--space-8)]">
          <ArtifactTile
            kind="spec"
            className="col-span-12 md:col-span-4"
            title="weekly-loop — spec v0"
            excerpt="A weekly check-in app for indie devs. v1 ships the one-sentence-on-Sunday loop, a strangers-only group of size three to five, and a Friday self-reckoning…"
            tokensUsed={28104}
            finishedAt="just now"
          />
          <ArtifactTile
            kind="summary"
            className="col-span-12 md:col-span-4"
            title="Executive summary"
            excerpt="A two-paragraph distillation: what weekly-loop is, who it's for, the one hard product call (small strangers-only groups), and the v1 success heuristic."
            tokensUsed={6240}
            finishedAt="just now"
          />
          <ArtifactTile
            kind="callouts"
            className="col-span-12 md:col-span-4"
            title="Out-of-scope call-outs"
            excerpt="Five threads the personas raised and chose to leave for v2: long-form journaling, public profiles, payment, mobile-first push, and AI-generated nudges."
            tokensUsed={4118}
            finishedAt="just now"
            downloaded
          />
        </section>

        <footer className="flex items-center justify-between border-t border-[color:var(--paper-edge)] pt-[var(--space-5)]">
          <Link href="/app/sessions/abc123/transcript" variant="default">
            Read the full transcript →
          </Link>
          <div className="flex items-center gap-[var(--space-3)]">
            <Button variant="secondary">Save & close</Button>
            <Button variant="primary">Start another session</Button>
          </div>
        </footer>
      </main>
    </>
  );
}
