// design/primitives/artifact-tile.tsx
// ---------------------------------------------------------------------------
// ArtifactTile — the downloadable-output preview.
//
// v1 ships exactly three artifacts: spec.md, exec summary, call-outs.
// Each tile shows: kind label, title, two-line excerpt, byline (token
// budget consumed + finished-at), and a download action.
//
// The tile is a "paper sheet" — paper-raised face, thin edge, a tiny
// folded-corner flag on the top-right when the artifact is fresh
// (downloaded=false). The corner flag is the only place outside the
// primary CTA where the accent shows up on this surface.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/cn";

export type ArtifactKind = "spec" | "summary" | "callouts";

interface ArtifactTileProps {
  kind: ArtifactKind;
  title: string;
  excerpt: string;       // 1-2 lines, plain text
  tokensUsed: number;    // budget consumed
  finishedAt: string;    // pre-formatted relative time
  downloaded?: boolean;
  onDownload?: () => void;
  className?: string;
}

const kindLabel: Record<ArtifactKind, string> = {
  spec: "spec.md",
  summary: "exec summary",
  callouts: "call-outs",
};

export function ArtifactTile({
  kind,
  title,
  excerpt,
  tokensUsed,
  finishedAt,
  downloaded = false,
  onDownload,
  className,
}: ArtifactTileProps) {
  return (
    <article
      data-downloaded={downloaded || undefined}
      className={cn(
        "relative",
        "bg-[color:var(--paper-raised)] text-[color:var(--ink)]",
        "border border-[color:var(--paper-edge)]",
        "rounded-[var(--radius-md)]",
        "shadow-[var(--shadow-resting)]",
        "p-[var(--space-5)]",
        "flex flex-col gap-[var(--space-4)] min-h-[260px]",
        className
      )}
    >
      {/* folded-corner flag — only when fresh */}
      {!downloaded && (
        <span
          aria-hidden
          className={cn(
            "absolute top-0 right-0 w-[20px] h-[20px]",
            "bg-[color:var(--accent)]",
            "[clip-path:polygon(100%_0,100%_100%,0_0)]"
          )}
        />
      )}

      <header className="flex flex-col gap-[var(--space-2)]">
        <span className="font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          {kindLabel[kind]}
        </span>
        <h3 className="font-[var(--font-serif)] font-semibold text-[var(--text-lg)] leading-[var(--leading-heading)] text-[color:var(--ink-strong)]">
          {title}
        </h3>
      </header>

      <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] flex-1">
        {excerpt}
      </p>

      <footer className="flex items-center justify-between gap-[var(--space-3)] pt-[var(--space-3)] border-t border-[color:var(--paper-edge)]">
        <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-faint)]">
          {tokensUsed.toLocaleString()} tok · {finishedAt}
        </span>
        <button
          type="button"
          onClick={onDownload}
          className={cn(
            "inline-flex items-center gap-[var(--space-2)]",
            "h-[32px] px-[var(--space-3)]",
            "font-[var(--font-sans)] text-[var(--text-xs)] font-medium tracking-[var(--tracking-ui)]",
            "rounded-[var(--radius-sm)]",
            "border border-[color:var(--paper-edge)]",
            "text-[color:var(--ink)] bg-[color:var(--paper)]",
            "hover:bg-[color:var(--paper-sunken)] hover:border-[color:var(--ink-faint)]",
            "transition-colors duration-[var(--t-lift)]"
          )}
        >
          {downloaded ? "Download again" : "Download"}
        </button>
      </footer>
    </article>
  );
}
