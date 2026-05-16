// design/primitives/turn-bubble.tsx
// ---------------------------------------------------------------------------
// TurnBubble — one persona utterance in the transcript.
//
// Anatomy:
//   • Gutter: persona monogram + name + voice register (italic)
//   • Body: the persona's actual line, serif, generous leading
//   • Footnote: optional cited turn-ref (e.g. "↳ replying to Mara")
//
// "I'm thinking" affordance: when `thinking` is true, the body slot
// renders three pulsing ink dots; no text streams in yet. This is the
// state for "persona is composing, no characters yet."
//
// When `streaming` is true, the body shows the partial text plus a
// blinking ink caret. The bubble does not lay out differently — the
// caret is the only signal.
//
// Variants:
//   • register="lead"       — default; serif italic byline
//   • register="moderator"  — accent-2 register; system turns ("Boardroom
//     suggests we wrap"). Used <5% of the time.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

interface TurnBubbleProps {
  name: string;
  voice: string;
  monogram: string;
  body?: React.ReactNode;
  thinking?: boolean;
  streaming?: boolean;
  register?: "lead" | "moderator";
  replyingTo?: string;
  className?: string;
}

export function TurnBubble({
  name,
  voice,
  monogram,
  body,
  thinking = false,
  streaming = false,
  register = "lead",
  replyingTo,
  className,
}: TurnBubbleProps) {
  const isModerator = register === "moderator";

  return (
    <article
      data-thinking={thinking || undefined}
      data-register={register}
      className={cn(
        "grid grid-cols-[44px_minmax(0,1fr)] gap-[var(--space-4)]",
        "py-[var(--space-5)]",
        "border-b border-[color:var(--paper-edge)] last:border-b-0",
        "transition-opacity duration-[var(--t-recede)] ease-[var(--ease-recede)]",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "w-[44px] h-[44px] inline-flex items-center justify-center",
          "font-[var(--font-serif)] italic font-semibold text-[var(--text-md)]",
          "rounded-[var(--radius-sm)]",
          isModerator
            ? "bg-[color:var(--accent-2-tint)] text-[color:var(--accent-2)]"
            : "bg-[color:var(--paper-sunken)] text-[color:var(--ink-strong)]",
          "shadow-[inset_0_1px_2px_oklch(0%_0_0_/_0.06)]"
        )}
      >
        {monogram}
      </span>

      <div className="min-w-0">
        <header className="flex items-baseline gap-[var(--space-3)] mb-[var(--space-2)]">
          <span
            className={cn(
              "font-[var(--font-serif)] font-semibold text-[var(--text-sm)]",
              isModerator
                ? "text-[color:var(--accent-2)]"
                : "text-[color:var(--ink-strong)]"
            )}
          >
            {name}
          </span>
          <span className="font-[var(--font-sans)] text-[var(--text-2xs)] italic text-[color:var(--ink-muted)]">
            {voice}
          </span>
          {replyingTo && (
            <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-faint)]">
              ↳ replying to {replyingTo}
            </span>
          )}
        </header>

        {thinking ? (
          <p
            aria-live="polite"
            aria-label={`${name} is thinking`}
            className="flex items-center gap-[6px] h-[1.6em]"
          >
            <Dot delay={0} />
            <Dot delay={140} />
            <Dot delay={280} />
            <span className="ml-[var(--space-3)] font-[var(--font-sans)] text-[var(--text-2xs)] italic text-[color:var(--ink-faint)]">
              {name.split(" ")[0]} is thinking
            </span>
          </p>
        ) : (
          <p
            className={cn(
              "font-[var(--font-serif)] text-[var(--text-base)] leading-[var(--leading-prose)]",
              "text-[color:var(--ink)]",
              "[&_em]:italic [&_em]:text-[color:var(--ink-strong)]"
            )}
          >
            {body}
            {streaming && (
              <span
                aria-hidden
                className="inline-block w-[2px] h-[1em] align-[-2px] ml-[2px] bg-[color:var(--ink)] animate-[blink_1s_step-end_infinite]"
              />
            )}
          </p>
        )}
      </div>
    </article>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block w-[6px] h-[6px] rounded-full bg-[color:var(--ink-muted)] opacity-40 animate-[turnDot_1.2s_ease-in-out_infinite]"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/* Keyframes — declared once in globals.css alongside the design import.
   @keyframes turnDot { 0%,80%,100% { opacity: 0.2 } 40% { opacity: 0.9 } }
   @keyframes blink   { 50% { opacity: 0 } }
*/
