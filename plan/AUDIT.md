# Site audit

> Latest findings from `/iterate audit`. Rewritten on each audit
> pass. Manual entries are allowed; `/iterate audit` should
> preserve rows whose source is `[oversight]` or `[user]`.

## Pending

### [needs-e2e] Magic-link sign-in walk

- **Source:** oversight 2026-05-16 (phase 3 brief filed as
  follow-up; lifted here for visibility)
- **Score:** 4.0 (high — gates production sign-in; will block
  phase 6 demo polish if unaddressed)
- **Category:** test
- **Summary:** The phase 3 verify gate covers `/signin` render
  + `/app → /signin` redirect, but **does not** walk a real
  magic link end-to-end. A regression in `signInWithOtp`,
  `/auth/callback`, or Supabase Site-URL config can ship green.
- **What to ship:** A Playwright e2e that hits `/signin`,
  submits a real test-inbox email (Mailosaur / Postmark / a
  `+e2e@` Gmail filter — pick one and pin in `.env.example`),
  pulls the link, follows it, asserts landing at `/app` as
  the test user.
- **When:** before phase 6's demo loop ships; phase 6 needs
  the auth flow to be trustworthy under regression.
- **Owner:** `/iterate` or phase 6 prep, whichever runs first.
