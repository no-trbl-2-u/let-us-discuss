// design/primitives/card.tsx
// ---------------------------------------------------------------------------
// Card — paper plate, raised one stop off the table. Default radius is md
// (4px). Use `flat` when the card is part of a denser list and the resting
// shadow would noise up the rhythm.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
  as?: React.ElementType;
}

export function Card({ flat = false, as, className, ...rest }: CardProps) {
  const Tag = (as ?? "div") as React.ElementType;
  return (
    <Tag
      className={cn(
        "bg-[color:var(--paper-raised)] text-[color:var(--ink)]",
        "rounded-[var(--radius-md)]",
        "border border-[color:var(--paper-edge)]",
        flat ? "shadow-none" : "shadow-[var(--shadow-lifted)]",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-3)]",
        "border-b border-[color:var(--paper-edge)]",
        className
      )}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-[var(--space-5)]", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-[var(--space-5)] py-[var(--space-3)]",
        "border-t border-[color:var(--paper-edge)]",
        "flex items-center justify-end gap-[var(--space-3)]",
        className
      )}
      {...rest}
    />
  );
}
