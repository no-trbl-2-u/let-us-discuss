// design/primitives/skeleton.tsx
// ---------------------------------------------------------------------------
// Skeleton — paper-sunken block used as a loading-state placeholder.
// Respects prefers-reduced-motion: when the user opts out, the block
// stays in its rest state (no shimmer). Per bearings standing decision:
// loading state is skeleton blocks via a primitive — no spinners.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pass-through className; consumers shape via Tailwind utilities. */
  className?: string;
}

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      data-skeleton
      className={cn(
        "rounded-[var(--radius-sm)]",
        "bg-[color:var(--paper-sunken)]",
        "border border-[color:var(--paper-edge)]",
        "motion-safe:animate-pulse",
        className,
      )}
      {...rest}
    />
  );
}
