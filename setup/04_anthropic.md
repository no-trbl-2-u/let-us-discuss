# Anthropic setup — boardroom

> **PARTIAL.** Phase 7b's multi-persona orchestrator shipped at
> `305bb25` and reads `ANTHROPIC_API_KEY` at request time. The
> code throws `AnthropicConfigError` if the key is missing and
> the SSE stream surfaces it as `session.error
> code=anthropic-config`. Deploy doesn't require the key at
> boot. Reach `OK` when the operator confirms the production
> env has the key populated AND a real session walk has proven
> the orchestrator end-to-end (operator-gated; the hermetic e2e
> gate can't reach this).
>
> **Account:** TBD (the user's personal Anthropic account)
> **Dashboard:** https://console.anthropic.com

See `../../nexus/customization/external-services.md`.

---

## What boardroom needs from Anthropic

- Persona reasoning (every conferring turn) — phase 7+.
- Tool-use / structured output for the convergence /
  escalation signals — phase 7+.

## What Anthropic is NOT doing (deferred)

- Moderation — that's OpenAI's omni-moderation, in `05_openai.md`.
- Anthropic batch API — out of v1 (sessions are interactive).

---

## Section A — API key

Path: Console → Settings → API Keys

- [ ] Create a key named `boardroom-prod`
- [ ] Drop into local `.env` as `ANTHROPIC_API_KEY`
- [ ] Mirror into Vercel env vars (Production + Preview only;
      not Development)

## Section B — Spend limits

Path: Console → Settings → Plans & billing

- [ ] Soft spend limit: $20/mo (initial; revise as v1 traffic
      shapes up)
- [ ] Hard cap: $50/mo
- [ ] Email alerts at 50% / 75% / 100%

## Section C — Model defaults

`.env`:

```
ANTHROPIC_MODEL=claude-opus-4-7
```

Per-persona override via `personas/<name>.md` frontmatter
`model:` field. Lower-cost personas may pin
`claude-haiku-4-5-20251001` for cheaper roles.

---

## Verification (run before unattended)

- [ ] A single `messages.create` call against
      `claude-opus-4-7` returns a valid response.
- [ ] Spend usage dashboard reflects the test call within
      5 minutes.
