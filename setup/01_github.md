# GitHub setup — boardroom

> **PARTIAL.** PAT is populated (`GH_TOKEN` in `.env` drives
> the loop's `gh issue` calls + `scripts/loop-issue.mjs` for
> phase mirrors + /triage routing — all confirmed across the
> 18 phase ships and the post-build /iterate ticks). Branch
> protection remains unverified; the loop hasn't required it.
> Reach `OK` when an operator confirms or deliberately defers
> branch protection.
>
> **Account:** `no-trbl-2-u`
> **Repo:** `no-trbl-2-u/let-us-discuss` (production name is
> `boardroom`; repo slug differs)
> **Dashboard:** https://github.com/no-trbl-2-u/let-us-discuss

See `../../nexus/customization/external-services.md` for why
this runbook exists and how the loop reads it.

---

## What boardroom needs from GitHub

- Push surface (`main` → triggers Vercel deploy) — every phase.
- Issue triage (`/triage`) — post-phase-1.
- Per-phase issue mirror (`scripts/loop-issue.mjs`) — once the
  cloud loop adopts (opt-in, not v1).
- PR previews via Vercel — every phase.

## What GitHub is NOT doing (deferred)

- GitHub Actions cloud loop — opt-in, post-v1 stabilization.
- GitHub App for triage — PAT is sufficient at v1 volume.

---

## Section A — Repo settings

Path: Settings → General

- [ ] Default branch: `main`
- [ ] Disable wiki, projects, discussions until v1 ships
- [ ] Disable forking until v1 ships

## Section B — Branch protection on `main`

Path: Settings → Branches → Add rule

- [ ] Require PR before merging (off in v1 — solo dev pushes
      direct to `main`; revisit once a second human commits)
- [ ] Require status checks to pass — once Vercel preview
      checks are wired (after phase 1 ships)

## Section C — PAT for `/triage` and the loop

- [ ] Create classic PAT at https://github.com/settings/tokens
- [ ] Scopes: `repo` (full), `read:org`
- [ ] Drop into `.env` as `GH_TOKEN`
- [ ] Set `GH_REPO=no-trbl-2-u/let-us-discuss` in `.env`

## Section D — Default labels (for `/triage`)

Path: Issues → Labels

Add the standard triage labels (see
`../../nexus/templates/skills/triage.md`):

- [ ] `bug`, `enhancement`, `question`, `wontfix`, `duplicate`
- [ ] `phase:N` family — created lazily as phases ship

---

## Verification (run before unattended)

- [ ] `gh auth status` reports authenticated against the PAT
- [ ] `gh repo view` returns the repo metadata
- [ ] `gh issue list` returns successfully (may be empty)
