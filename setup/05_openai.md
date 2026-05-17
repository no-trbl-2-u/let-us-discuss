# OpenAI setup — boardroom

> **STUB.** Key not yet created. Used solely for the
> moderation pre-filter; no generation calls go to OpenAI.
> Phase 8 (moderation gates) shipped against the unset-key
> path: when `OPENAI_API_KEY` is unset the moderation gate
> opens with a single `console.warn` and falls through. Setting
> the key flips behavior to actual moderation calls.
>
> **Account:** TBD (the user's personal OpenAI account)
> **Dashboard:** https://platform.openai.com

See `../../nexus/customization/external-services.md`.

---

## What boardroom needs from OpenAI

- `omni-moderation-latest` calls on:
  - The user's pitch / typed input, **before** fan-out to
    persona prompts.
  - Each persona output, **before** render / persist.

Single endpoint; no generation, no embeddings, no other
surfaces at v1.

## What OpenAI is NOT doing (deferred / never)

- Persona reasoning — that's Anthropic.
- Embeddings / vector search — not used at v1.
- GPT-4o / GPT-5 generation — not used.

---

## Section A — API key

Path: https://platform.openai.com/api-keys

- [ ] Create a key named `boardroom-moderation` scoped to
      `omni-moderation-latest` only (use a Restricted API
      key with only the Moderation endpoint enabled if the
      account tier allows it; otherwise standard key + spend
      caps in Section B).
- [ ] Drop into local `.env` as `OPENAI_API_KEY`
- [ ] Mirror into Vercel env vars (Production + Preview only)

## Section B — Spend limits

Path: Platform → Billing → Limits

- [ ] Soft limit: $5/mo (moderation is cheap; this is
      generous)
- [ ] Hard cap: $10/mo
- [ ] Email alerts at 50% / 100%

## Section C — Model pin

`.env`:

```
OPENAI_MODERATION_MODEL=omni-moderation-latest
```

The `omni-moderation-latest` model is multi-modal (text +
image) but v1 only checks text. Pin to `-latest` so the
moderation classifier improves with the rolling release.

---

## Verification (run before unattended)

- [ ] A single moderation call on the string `"hello world"`
      returns `flagged: false`.
- [ ] A single moderation call on a deliberately-suspect
      string (use the OpenAI docs' canonical example)
      returns `flagged: true`.
- [ ] Spend dashboard reflects test calls within 5 minutes.
