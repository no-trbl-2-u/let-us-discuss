// design/compositions/home.tsx
// ---------------------------------------------------------------------------
// Home — the marketing surface. Editorial print register. No hero gradient,
// no animated background. Three vertical movements:
//   1. Wordmark + one-line pitch + "Try a demo session" / "Sign in"
//   2. The metaphor explained in three short notes (numbered like a
//      table of contents in a hardcover book).
//   3. The persona shelf (a row of resting persona cards — clickable,
//      navigates to /try with that persona pre-staffed).
//
// Copy is from spec.md voice: "Knowledgeable colleague who's been-there.
// Plainspoken, terse, no marketing fluff."
// ---------------------------------------------------------------------------

import { Nav } from "../primitives/nav";
import { Heading } from "../primitives/heading";
import { Button } from "../primitives/button";
import { Link } from "../primitives/link";
import { PersonaCard } from "../primitives/persona-card";

const DEMO_PERSONAS = [
  { name: "Mara Olesen", role: "Product Editor", voice: "concise", monogram: "MO", blurb: "Holds the spec honest; pushes for cuts." },
  { name: "Devin Park", role: "Skeptical Engineer", voice: "blunt", monogram: "DP", blurb: "Flags scope creep and the hard parts." },
  { name: "June Ode", role: "End-User Proxy", voice: "patient", monogram: "JO", blurb: "Reads the spec as a stranger would." },
  { name: "Asher Vale", role: "Growth Voice", voice: "skeptical", monogram: "AV", blurb: "Sniffs at jargon; asks who pays." },
];

export default function HomePage() {
  return (
    <>
      <Nav
        items={[
          { href: "/about", label: "About" },
          { href: "/try", label: "Try a session" },
        ]}
        cta={{ href: "/signin", label: "Sign in" }}
      />

      <main className="mx-auto max-w-[1040px] px-[var(--space-7)] py-[var(--space-8)]">
        {/* 1. opening pitch */}
        <section className="grid grid-cols-12 gap-[var(--space-6)] mb-[var(--space-8)]">
          <div className="col-span-12 md:col-span-8">
            <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
              boardroom &nbsp;·&nbsp; v1
            </p>
            <Heading level={1} className="mb-[var(--space-5)]">
              A short, opinionated meeting between AI personas — and you
              leave with a usable spec.
            </Heading>
            <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] mb-[var(--space-6)]">
              Drop a few personas onto the table, hand them your pitch, and
              let them confer. You answer one-word questions at the
              checkpoints. They do the thinking.
            </p>
            <div className="flex items-center gap-[var(--space-4)]">
              <Button variant="primary">Try a demo session</Button>
              <Link href="/about" variant="default">
                What is a boardroom session?
              </Link>
            </div>
          </div>
        </section>

        {/* 2. three notes */}
        <section aria-labelledby="how-it-works" className="grid grid-cols-12 gap-[var(--space-6)] mb-[var(--space-8)]">
          <Heading level={4} eyebrow as="h2" id="how-it-works" className="col-span-12">
            How a session runs
          </Heading>
          {[
            { n: "i.",   t: "Staff the table.", b: "Drag two to six personas from the shelf onto the boardroom. Each persona has a fixed voice and role — you don't write prompts." },
            { n: "ii.",  t: "Hand over the pitch.", b: "Paste a paragraph. The leads circle once with one-sentence clarifying questions. ‘I don't know’ is a valid answer." },
            { n: "iii.", t: "Take the artifacts.", b: "Personas confer, converge, and emit three files: a spec, an exec summary, and a list of out-of-scope call-outs." },
          ].map((note) => (
            <article key={note.n} className="col-span-12 md:col-span-4">
              <span className="font-[var(--font-serif)] italic text-[var(--text-md)] text-[color:var(--ink-faint)]">
                {note.n}
              </span>
              <h3 className="mt-[var(--space-2)] mb-[var(--space-3)] font-[var(--font-serif)] font-semibold text-[var(--text-lg)] text-[color:var(--ink-strong)] leading-[var(--leading-heading)]">
                {note.t}
              </h3>
              <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)]">
                {note.b}
              </p>
            </article>
          ))}
        </section>

        {/* 3. persona shelf */}
        <section aria-labelledby="shelf">
          <div className="flex items-baseline justify-between mb-[var(--space-5)]">
            <Heading level={4} eyebrow as="h2" id="shelf">
              The v1 persona shelf
            </Heading>
            <Link href="/about#personas" variant="quiet" className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)]">
              How personas are written →
            </Link>
          </div>
          <div className="flex gap-[var(--space-4)] overflow-x-auto pb-[var(--space-4)]">
            {DEMO_PERSONAS.map((p) => (
              <PersonaCard key={p.name} {...p} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--paper-edge)] mt-[var(--space-8)]">
        <div className="mx-auto max-w-[1040px] px-[var(--space-7)] py-[var(--space-6)] flex items-center justify-between font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
          <span>boardroom — a nexus build</span>
          <span className="flex items-center gap-[var(--space-5)]">
            <Link href="/legal/privacy" variant="quiet">Privacy</Link>
            <Link href="/legal/terms" variant="quiet">Terms</Link>
            <Link href="/about" variant="quiet">About</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
