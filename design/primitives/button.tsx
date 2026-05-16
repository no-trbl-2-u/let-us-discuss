// design/primitives/button.tsx
// ---------------------------------------------------------------------------
// Button — primary / secondary / ghost.
// Primary uses the single accent. Secondary is paper-on-paper with an ink
// edge. Ghost is text-only. No icons-only variant in v1 (the spec doesn't
// call for one; add later if a surface earns it).
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-[var(--space-2)] " +
  "font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] " +
  "rounded-[var(--radius-sm)] " +
  "transition-[background-color,color,box-shadow,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  md: "h-[40px] px-[var(--space-5)] text-[var(--text-sm)]",
  sm: "h-[32px] px-[var(--space-4)] text-[var(--text-xs)]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[color:var(--accent)] text-[color:var(--accent-ink)] " +
    "shadow-[var(--shadow-resting)] " +
    "hover:bg-[color:var(--accent-pressed)] " +
    "active:translate-y-[1px] active:shadow-none",
  secondary:
    "bg-[color:var(--paper-raised)] text-[color:var(--ink)] " +
    "border border-[color:var(--paper-edge)] " +
    "hover:bg-[color:var(--paper)] hover:border-[color:var(--ink-faint)] " +
    "active:translate-y-[1px]",
  ghost:
    "bg-transparent text-[color:var(--ink)] " +
    "hover:bg-[color:var(--paper-sunken)] " +
    "active:translate-y-[1px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    />
  )
);
Button.displayName = "Button";
