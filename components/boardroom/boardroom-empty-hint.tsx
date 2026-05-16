'use client'

// Canonical wrapper kept around so later in-app surfaces can mirror the
// `<Family>Empty` shape. The empty-state copy itself is rendered inline
// by `boardroom-surface.tsx` via the design's table primitive contract;
// this wrapper exists for structural parity, not duplication.

export function BoardroomEmptyHint() {
  return (
    <div data-boardroom-empty-hint className="sr-only">
      The boardroom is empty. Drag a persona from the shelf onto a seat to begin.
    </div>
  )
}
