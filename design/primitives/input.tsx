// design/primitives/input.tsx
// ---------------------------------------------------------------------------
// Input — text input + label + error state. The label is the eyebrow style
// (sans, tracked caps, muted), not floating. The input itself sits on
// paper-sunken with an ink underline; the underline turns accent on focus
// and signal-warning on error. Helper text and error text use the same
// type slot; only the color and content swaps.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

let nextId = 0;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, id, className, ...rest }, ref) => {
    const reactId = React.useId?.();
    const inputId = id ?? reactId ?? `input-${++nextId}`;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-[var(--space-2)]">
        {label && (
          <label
            htmlFor={inputId}
            className={
              "font-[var(--font-sans)] text-[var(--text-2xs)] font-medium " +
              "uppercase tracking-[var(--tracking-caps)] " +
              "text-[color:var(--ink-muted)]"
            }
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={error ? `${inputId}-err` : helper ? `${inputId}-hlp` : undefined}
          className={cn(
            "w-full h-[44px] px-[var(--space-4)]",
            "bg-[color:var(--paper-sunken)] text-[color:var(--ink)]",
            "font-[var(--font-sans)] text-[var(--text-sm)]",
            "placeholder:text-[color:var(--ink-faint)]",
            "rounded-[var(--radius-sm)]",
            "border-b-2 border-[color:var(--ink-strong)]",
            // sides + top: hairline; bottom-border carries the ink
            "shadow-[inset_0_0_0_1px_var(--paper-edge)]",
            "outline-none",
            "transition-[border-color,background-color] duration-[var(--t-lift)]",
            "focus:bg-[color:var(--paper-raised)]",
            "focus:border-[color:var(--accent)]",
            hasError && "border-[color:var(--signal-warning)] bg-[color:var(--signal-warning-tint)]",
            className
          )}
          {...rest}
        />
        {(error || helper) && (
          <p
            id={hasError ? `${inputId}-err` : `${inputId}-hlp`}
            className={cn(
              "font-[var(--font-sans)] text-[var(--text-2xs)]",
              hasError ? "text-[color:var(--signal-warning)]" : "text-[color:var(--ink-muted)]"
            )}
          >
            {hasError ? error : helper}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
