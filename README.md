# boardroom

A drag-and-drop board-room simulator that turns a loose pitch into a concrete
spec by orchestrating a short, opinionated conversation between AI personas.
This repo is the v1 build of that product, driven phase-by-phase by the
autonomous loop under [nexus](../nexus).

- [`spec.md`](./spec.md) — product spec
- [`plan/bearings.md`](./plan/bearings.md) — standing context for every command
- [`agents.md`](./agents.md) — agent + skill operating rules
- [`plan/steps/01_build_plan.md`](./plan/steps/01_build_plan.md) — phase ladder

## Commands

```bash
pnpm dev               # next dev
pnpm verify            # typecheck + test:run + data:validate + build + e2e
pnpm deploy:check      # poll Vercel for the deploy at HEAD
```
