// design/primitives/persona-card.tsx
// ---------------------------------------------------------------------------
// PersonaCard — the draggable persona tile.
//
// Two states carry the metaphor:
//   1. "resting" — sitting on the shelf next to the table. Slight resting
//      shadow (a real card on a real desk casts a hairline shadow). The
//      cursor on hover is `grab`. Hover lifts the card 2px.
//   2. "staffed" — currently seated at the boardroom-table. Marked with
//      a small oxidized-red stamp; the "Selected" affordance is the most
//      saturated chroma we use anywhere in the product.
//
// Identity is typographic + iconographic. No avatar photos, ever (see
// design/decisions.md § Won't do).
//
//   ┌─────────────────────────┐
//   │ ┌──┐                    │   monogram is two-letter initial; serif italic;
//   │ │PE│  Product Editor    │   monogram chip is paper-sunken (a notch
//   │ └──┘  voice · concise   │   debossed into the card).
//   │                          │
//   │ Holds the spec honest;   │
//   │ pushes for cuts.         │
//   └─────────────────────────┘
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

export type PersonaCardState = "resting" | "hover" | "dragging" | "staffed";

interface PersonaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role: string;             // short label, e.g. "Product Editor"
  voice: string;            // 1-2 words, e.g. "concise", "skeptical"
  blurb: string;            // single sentence — why you'd staff them
  monogram: string;         // 2 chars
  state?: PersonaCardState; // controlled by dnd-kit upstream
  draggable?: boolean;      // when false (results view), removes grab cursor
}

export function PersonaCard({
  name,
  role,
  voice,
  blurb,
  monogram,
  state = "resting",
  draggable = true,
  className,
  "aria-label": ariaLabelProp,
  ...rest
}: PersonaCardProps & { "aria-label"?: string }) {
  const isDragging = state === "dragging";
  const isStaffed = state === "staffed";

  // When the card is the focusable surface (draggable), the
  // caller supplies its own aria-label or we fall back to a
  // role+pressed pattern. When non-draggable (a seated tile
  // rendered inside a DroppableSeat, or a persona-library
  // entry), provide an accessible name on the article so SR
  // users hear "<role>: <name> (seated)" without needing to
  // navigate into the badge.
  const defaultLabel = isStaffed
    ? `${role}: ${name} (seated)`
    : !draggable
      ? `${role}: ${name}`
      : undefined;
  const articleAriaLabel = ariaLabelProp ?? defaultLabel;

  return (
    <article
      role={draggable ? "button" : undefined}
      tabIndex={draggable ? 0 : undefined}
      aria-pressed={isStaffed || undefined}
      aria-label={articleAriaLabel}
      data-state={state}
      className={cn(
        "relative w-[260px] select-none",
        "bg-[color:var(--paper-raised)] text-[color:var(--ink)]",
        "border border-[color:var(--paper-edge)]",
        "rounded-[var(--radius-md)]",
        "p-[var(--space-4)]",
        "transition-[transform,box-shadow,background-color] duration-[var(--t-lift)] ease-[var(--ease-lift)]",
        draggable && "cursor-grab active:cursor-grabbing",
        // resting state
        !isDragging && !isStaffed && "shadow-[var(--shadow-resting)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lifted)]",
        // dragging state — lifted, slight tilt, ink edge gets darker
        isDragging && "shadow-[var(--shadow-dragging)] rotate-[-1.5deg] cursor-grabbing border-[color:var(--ink-faint)]",
        // staffed state — accent stamp + accent-tinted edge
        isStaffed && "border-[color:var(--accent)] bg-[color:var(--paper-raised)] shadow-[var(--shadow-resting)]",
        className
      )}
      {...rest}
    >
      {isStaffed && (
        <span
          aria-label="Staffed"
          className={cn(
            "absolute -top-[8px] right-[var(--space-4)]",
            "h-[20px] px-[var(--space-2)] inline-flex items-center",
            "bg-[color:var(--accent)] text-[color:var(--accent-ink)]",
            "font-[var(--font-mono)] text-[var(--text-3xs)] uppercase tracking-[var(--tracking-caps)]",
            "rounded-[var(--radius-sm)] shadow-[var(--shadow-resting)]"
          )}
        >
          seated
        </span>
      )}

      <header className="flex items-center gap-[var(--space-3)]">
        <span
          aria-hidden
          className={cn(
            "w-[44px] h-[44px] inline-flex items-center justify-center",
            "bg-[color:var(--paper-sunken)] text-[color:var(--ink-strong)]",
            "font-[var(--font-serif)] italic font-semibold text-[var(--text-md)]",
            "rounded-[var(--radius-sm)]",
            // inset shadow gives the "debossed monogram" feel
            "shadow-[inset_0_1px_2px_oklch(0%_0_0_/_0.08),inset_0_-1px_0_oklch(100%_0_0_/_0.6)]"
          )}
        >
          {monogram}
        </span>

        <div className="flex flex-col leading-tight">
          <span className="font-[var(--font-serif)] font-semibold text-[var(--text-sm)] text-[color:var(--ink-strong)]">
            {name}
          </span>
          <span className="font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
            {role} · <span className="italic">{voice}</span>
          </span>
        </div>
      </header>

      <p className="mt-[var(--space-3)] font-[var(--font-serif)] text-[var(--text-xs)] leading-[var(--leading-snug)] text-[color:var(--ink-muted)]">
        {blurb}
      </p>
    </article>
  );
}
