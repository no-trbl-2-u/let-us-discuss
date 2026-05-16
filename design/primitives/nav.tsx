// design/primitives/nav.tsx
// ---------------------------------------------------------------------------
// Nav — top bar. Paper, hairline bottom edge, brandmark on the left,
// links on the right. No emoji, no icons-with-no-label. The brandmark
// is the wordmark only ("boardroom" in serif italic small-caps).
// ---------------------------------------------------------------------------

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface NavProps extends React.HTMLAttributes<HTMLElement> {
  // Items render right-aligned. Auth gates wrap us; we don't decide here.
  items?: Array<{ href: string; label: string }>;
  cta?: { href: string; label: string };
}

export function Nav({ items = [], cta, className, ...rest }: NavProps) {
  return (
    <header
      className={cn(
        "w-full",
        "bg-[color:var(--paper)]",
        "border-b border-[color:var(--paper-edge)]",
        className
      )}
      {...rest}
    >
      <div className="mx-auto max-w-[1200px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] h-[64px] flex items-center justify-between gap-[var(--space-3)]">
        <Link
          href="/"
          className="font-[var(--font-serif)] italic text-[var(--text-md)] tracking-[var(--tracking-tight)] text-[color:var(--ink-strong)]"
          aria-label="boardroom — home"
        >
          boardroom
        </Link>

        <nav className="flex items-center gap-[var(--space-3)] md:gap-[var(--space-5)]">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={
                "font-[var(--font-sans)] text-[var(--text-sm)] " +
                "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] " +
                "transition-colors duration-[var(--t-lift)]"
              }
            >
              {it.label}
            </Link>
          ))}
          {cta && (
            <Link
              href={cta.href}
              className={
                "font-[var(--font-sans)] text-[var(--text-sm)] font-medium " +
                "tracking-[var(--tracking-ui)] " +
                "h-[36px] px-[var(--space-4)] inline-flex items-center " +
                "rounded-[var(--radius-sm)] " +
                "bg-[color:var(--ink-strong)] text-[color:var(--paper)] " +
                "hover:bg-[color:var(--ink)] transition-colors duration-[var(--t-lift)]"
              }
            >
              {cta.label}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
