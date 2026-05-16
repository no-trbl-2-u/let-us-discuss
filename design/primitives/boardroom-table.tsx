// design/primitives/boardroom-table.tsx
// ---------------------------------------------------------------------------
// BoardroomTable — the drop target. This is the load-bearing surface of the
// product. The metaphor: a real wooden conference table, viewed top-down.
//
// Three states:
//   • empty   — visible seat outlines (debossed paper); empty-state copy
//   • seated  — staffed personas placed around the table edge
//   • active  — a session is running; the table interior shows a soft
//     accent-2 rail at the top edge ("session in progress") and individual
//     seats halo briefly when their persona is mid-turn.
//
// We don't draw a literal wood texture. Paper-sunken interior, hairline
// edge — the table is paper too, just a slightly different paper.
//
// Seats are placed on an oval ring; in v1 we ship 6 seats (the spec caps
// session size at 6). They are rendered at canonical positions so dnd-kit
// only needs to test "near which seat" for drops.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";
import { PersonaCard } from "./persona-card";

export type Seat = {
  id: number;
  /** position around the ring, 0..1 starting at top-center clockwise */
  t: number;
  /** filled when staffed */
  persona?: {
    name: string;
    role: string;
    voice: string;
    blurb: string;
    monogram: string;
  };
  /** true while this seat's persona holds the floor */
  speaking?: boolean;
};

interface BoardroomTableProps {
  seats: Seat[];
  state: "empty" | "seated" | "active";
  className?: string;
}

const TABLE_W = 880;
const TABLE_H = 520;
const RING_INSET_X = 110;
const RING_INSET_Y = 90;

function seatPosition(t: number) {
  // Place seat on an ellipse around the table edge.
  const angle = -Math.PI / 2 + t * Math.PI * 2;
  const a = TABLE_W / 2 - RING_INSET_X;
  const b = TABLE_H / 2 - RING_INSET_Y;
  return {
    left: TABLE_W / 2 + Math.cos(angle) * a,
    top: TABLE_H / 2 + Math.sin(angle) * b,
  };
}

export function BoardroomTable({ seats, state, className }: BoardroomTableProps) {
  return (
    <div
      data-state={state}
      className={cn(
        "relative mx-auto",
        "rounded-[var(--radius-lg)]",
        "bg-[color:var(--paper-sunken)]",
        "border border-[color:var(--paper-edge)]",
        // table itself is recessed into the page — opposite of a card
        "shadow-[inset_0_2px_4px_oklch(20%_0.01_60/0.05),inset_0_-1px_0_oklch(100%_0_0/0.4)]",
        className
      )}
      style={{ width: TABLE_W, height: TABLE_H }}
    >
      {/* Active-session rail */}
      {state === "active" && (
        <div
          aria-hidden
          className={cn(
            "absolute top-0 left-[var(--space-7)] right-[var(--space-7)] h-[3px]",
            "bg-[color:var(--accent-2)]",
            "rounded-b-[var(--radius-sm)]"
          )}
        />
      )}

      {/* Empty-state copy */}
      {state === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-2)] pointer-events-none">
          <p className="font-[var(--font-serif)] italic text-[var(--text-md)] text-[color:var(--ink-muted)]">
            Drag a persona onto the table to staff a seat.
          </p>
          <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-faint)]">
            Two to six seats &nbsp;·&nbsp; one short session
          </p>
        </div>
      )}

      {/* Seats */}
      {seats.map((seat) => {
        const pos = seatPosition(seat.t);
        const occupied = Boolean(seat.persona);
        return (
          <div
            key={seat.id}
            data-seat-id={seat.id}
            data-occupied={occupied}
            data-speaking={seat.speaking || undefined}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2",
              "transition-[transform,box-shadow] duration-[var(--t-settle)] ease-[var(--ease-settle)]",
              seat.speaking &&
                "after:absolute after:inset-[-10px] after:rounded-[var(--radius-md)] after:border after:border-[color:var(--accent)] after:opacity-60 after:animate-[pulse_var(--t-recede)_ease-out_infinite]"
            )}
            style={{ left: pos.left, top: pos.top }}
          >
            {occupied ? (
              <PersonaCard
                draggable={false}
                state="staffed"
                name={seat.persona!.name}
                role={seat.persona!.role}
                voice={seat.persona!.voice}
                blurb={seat.persona!.blurb}
                monogram={seat.persona!.monogram}
                className="w-[220px]"
              />
            ) : (
              <div
                aria-label={`Seat ${seat.id} — empty`}
                className={cn(
                  "w-[220px] h-[112px]",
                  "rounded-[var(--radius-md)]",
                  "border border-dashed border-[color:var(--paper-edge)]",
                  "bg-transparent",
                  "flex items-center justify-center",
                  "font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-faint)]"
                )}
              >
                seat {seat.id}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
