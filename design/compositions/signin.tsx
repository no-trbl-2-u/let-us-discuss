// design/compositions/signin.tsx
// ---------------------------------------------------------------------------
// Signin — magic-link form (Supabase Auth).
//
// One field. One button. One line of fine print. No social-auth chrome,
// no password ghost-form. The "knowledgeable colleague" voice is on full
// display: the body copy tells the user exactly what will happen next.
//
// Centered vertically; the wordmark sits above the card. After submit
// the same card swaps content to the post-submit state (rendered here
// inline as `state="sent"` for review).
// ---------------------------------------------------------------------------

import { Heading } from "../primitives/heading";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Link } from "../primitives/link";

interface SigninProps {
  state?: "form" | "sent" | "error";
  errorMessage?: string;
}

export default function SigninPage({ state = "form", errorMessage }: SigninProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-[var(--space-5)] py-[var(--space-8)]">
      <Link
        href="/"
        variant="quiet"
        className="mb-[var(--space-6)] font-[var(--font-serif)] italic text-[var(--text-md)] text-[color:var(--ink-strong)] no-underline"
      >
        boardroom
      </Link>

      <section
        className="w-full max-w-[440px] bg-[color:var(--paper-raised)] border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] shadow-[var(--shadow-lifted)] p-[var(--space-6)]"
        aria-labelledby="signin-h"
      >
        {state === "form" && (
          <>
            <Heading level={2} id="signin-h" className="mb-[var(--space-3)]">
              Sign in
            </Heading>
            <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-5)]">
              Enter your email and we'll send a one-time link. No password,
              no follow-ups. The link expires in fifteen minutes.
            </p>
            <form className="flex flex-col gap-[var(--space-5)]">
              <Input
                label="Email"
                type="email"
                placeholder="you@studio.com"
                helper="We never use this for anything else."
                error={state === "error" ? errorMessage : undefined}
              />
              <Button type="submit" variant="primary" className="w-full">
                Send the link
              </Button>
            </form>
          </>
        )}

        {state === "sent" && (
          <>
            <Heading level={2} className="mb-[var(--space-3)]">
              Check your inbox.
            </Heading>
            <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-5)]">
              We mailed a link to <span className="font-[var(--font-mono)] text-[color:var(--ink)]">you@studio.com</span>.
              Open it on this device. If it doesn't arrive within a minute,
              check spam or send a new one.
            </p>
            <Button variant="secondary" className="w-full">Send another link</Button>
          </>
        )}
      </section>

      <p className="mt-[var(--space-6)] font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        New here? <Link href="/about">What boardroom is.</Link>
      </p>
    </main>
  );
}
