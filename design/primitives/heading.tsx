// design/primitives/heading.tsx
// ---------------------------------------------------------------------------
// Heading — h1 through h4, type scale wired in.
// Serif by default (editorial gravitas); pass `sans` for UI section labels.
// h1: display register, used once per page.
// h4: section eyebrow, sans + tracked caps when `eyebrow` is set.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

type Level = 1 | 2 | 3 | 4;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: Level;
  sans?: boolean;
  eyebrow?: boolean; // tracked uppercase, sans, muted ink — only on level 4
  as?: React.ElementType;
}

const baseByLevel: Record<Level, string> = {
  1: "text-[var(--text-2xl)] md:text-[var(--text-3xl)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] font-semibold text-[color:var(--ink-strong)]",
  2: "text-[var(--text-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-tight)] font-semibold text-[color:var(--ink-strong)]",
  3: "text-[var(--text-lg)] leading-[var(--leading-heading)] font-semibold text-[color:var(--ink)]",
  4: "text-[var(--text-md)] leading-[var(--leading-snug)] font-medium text-[color:var(--ink)]",
};

export function Heading({
  level,
  sans = false,
  eyebrow = false,
  as,
  className,
  children,
  ...rest
}: HeadingProps) {
  const Tag = (as ?? `h${level}`) as React.ElementType;
  const family = sans || eyebrow ? "font-[var(--font-sans)]" : "font-[var(--font-serif)]";
  const eyebrowStyles = eyebrow
    ? "uppercase tracking-[var(--tracking-caps)] text-[var(--text-2xs)] text-[color:var(--ink-muted)] font-medium"
    : "";

  return (
    <Tag
      className={cn(baseByLevel[level], family, eyebrowStyles, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
