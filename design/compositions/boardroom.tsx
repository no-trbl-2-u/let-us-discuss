// design/compositions/boardroom.tsx
// ---------------------------------------------------------------------------
// Boardroom — the active session UI, mid-conversation.
//
// Layout (desktop):
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Nav                                                         │
//   ├──────────────┬──────────────────────────┬────────────────────┤
//   │  Persona     │   The Table              │  Transcript        │
//   │  Shelf       │   (active state)         │  (turn-bubbles)    │
//   │              │                          │                    │
//   │  3 resting   │   6 seats; 4 staffed     │  scroll, latest    │
//   │  cards       │   1 speaking             │  at bottom         │
//   │              │                          │                    │
//   │              │   Pitch field below      │                    │
//   └──────────────┴──────────────────────────┴────────────────────┘
//
// On <md: shelf becomes a horizontal scroller above the table; transcript
// stacks below.
// ---------------------------------------------------------------------------

import { Nav } from "../primitives/nav";
import { Heading } from "../primitives/heading";
import { BoardroomTable, type Seat } from "../primitives/boardroom-table";
import { PersonaCard } from "../primitives/persona-card";
import { TurnBubble } from "../primitives/turn-bubble";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";

const personas = {
  mara: { name: "Mara Olesen", role: "Product Editor", voice: "concise", monogram: "MO", blurb: "Holds the spec honest; pushes for cuts." },
  devin: { name: "Devin Park", role: "Skeptical Engineer", voice: "blunt", monogram: "DP", blurb: "Flags scope creep and the hard parts." },
  june: { name: "June Ode", role: "End-User Proxy", voice: "patient", monogram: "JO", blurb: "Reads the spec as a stranger would." },
  asher: { name: "Asher Vale", role: "Growth Voice", voice: "skeptical", monogram: "AV", blurb: "Sniffs at jargon; asks who pays." },
};

const seats: Seat[] = [
  { id: 1, t: 0.0,  persona: personas.mara },
  { id: 2, t: 1/6,  persona: personas.devin, speaking: true },
  { id: 3, t: 2/6 },
  { id: 4, t: 3/6,  persona: personas.june },
  { id: 5, t: 4/6 },
  { id: 6, t: 5/6,  persona: personas.asher },
];

const shelf = [
  { name: "Riya Tan", role: "Domain Expert", voice: "exacting", monogram: "RT", blurb: "Brings the technical floor; won't hand-wave." },
  { name: "Olu Bayo", role: "Time-Boxer", voice: "decisive", monogram: "OB", blurb: "Calls scope creep; ends loops cleanly." },
];

export default function BoardroomPage() {
  return (
    <>
      <Nav items={[{ href: "/app/sessions", label: "Past sessions" }]} cta={{ href: "/app", label: "MO" }} />

      <main className="mx-auto max-w-[1440px] px-[var(--space-6)] py-[var(--space-6)] grid grid-cols-12 gap-[var(--space-5)]">
        {/* shelf */}
        <aside className="col-span-12 md:col-span-2">
          <Heading level={4} eyebrow as="h2" className="mb-[var(--space-4)]">
            Shelf · drag to seat
          </Heading>
          <div className="flex md:flex-col gap-[var(--space-4)] overflow-x-auto md:overflow-visible">
            {shelf.map((p) => (
              <PersonaCard key={p.name} {...p} className="w-[220px] md:w-full" />
            ))}
          </div>
        </aside>

        {/* table + pitch */}
        <section className="col-span-12 md:col-span-7 flex flex-col gap-[var(--space-5)]">
          <div className="flex items-baseline justify-between">
            <Heading level={4} eyebrow as="h2">
              Boardroom · session in progress
            </Heading>
            <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-faint)]">
              phase 2 of 4 · 18,420 / 60,000 tok
            </span>
          </div>

          <BoardroomTable seats={seats} state="active" />

          <div className="bg-[color:var(--paper-raised)] border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] p-[var(--space-5)] shadow-[var(--shadow-lifted)]">
            <Heading level={4} className="mb-[var(--space-3)]">Your pitch</Heading>
            <p className="font-[var(--font-serif)] text-[var(--text-base)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
              A weekly accountability app for indie devs. You write one
              sentence every Sunday about what you'll ship by Friday; a
              small group of strangers reads it.
            </p>
            <div className="mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[color:var(--paper-edge)] flex items-center justify-between gap-[var(--space-3)]">
              <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-faint)]">
                accepted at the kickoff checkpoint
              </span>
              <Button variant="ghost" size="sm">Revise pitch</Button>
            </div>
          </div>
        </section>

        {/* transcript */}
        <section className="col-span-12 md:col-span-3 flex flex-col">
          <Heading level={4} eyebrow as="h2" className="mb-[var(--space-3)]">
            Transcript
          </Heading>
          <div className="bg-[color:var(--paper-raised)] border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] px-[var(--space-4)] flex-1 overflow-y-auto max-h-[640px]">
            <TurnBubble
              {...personas.mara}
              body={<>Treat “weekly” as the load-bearing word. If readers don't show up <em>weekly</em> the loop dies. So the v1 spec needs a readership floor.</>}
            />
            <TurnBubble
              {...personas.june}
              body={<>Strangers reading you on Sunday night feels intimate. What do they get for showing up? Do they post too?</>}
              replyingTo="Mara"
            />
            <TurnBubble
              {...personas.devin}
              thinking
            />
            <TurnBubble
              name="Boardroom"
              voice="moderator"
              monogram="BR"
              register="moderator"
              body={<>Suggesting we lock the readership question before drafting the spec. Want me to put it to the user?</>}
            />
          </div>
          <div className="mt-[var(--space-4)] flex items-center gap-[var(--space-3)]">
            <Input className="flex-1" placeholder="One-sentence nudge…" />
            <Button variant="secondary" size="sm">Send</Button>
          </div>
        </section>
      </main>
    </>
  );
}
