// design/primitives/link.tsx
// ---------------------------------------------------------------------------
// Link — inline editorial link with an underline that thickens on hover.
// `variant="quiet"` is the chrome link (no underline, muted ink).
// Wraps next/link so it gets prefetch + history out of the box.
// ---------------------------------------------------------------------------

import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/cn";

type Variant = "default" | "quiet";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default:
    "text-[color:var(--ink-strong)] " +
    "underline decoration-[color:var(--paper-edge)] decoration-1 underline-offset-[3px] " +
    "hover:decoration-[color:var(--accent)] hover:decoration-2 " +
    "transition-[text-decoration-color,text-decoration-thickness] duration-[var(--t-lift)]",
  quiet:
    "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] no-underline " +
    "transition-colors duration-[var(--t-lift)]",
};

export function Link({ href, variant = "default", className, children, ...rest }: LinkProps) {
  const isExternal = /^https?:\/\//.test(href);
  const cls = cn("font-inherit", variants[variant], className);
  if (isExternal) {
    return (
      <a href={href} className={cls} rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <NextLink href={href} className={cls} {...rest}>
      {children}
    </NextLink>
  );
}
