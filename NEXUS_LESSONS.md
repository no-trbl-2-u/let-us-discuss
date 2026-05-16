# NEXUS_LESSONS — boardroom pre-spec

> Field notes captured during the boardroom pre-spec interview
> on 2026-05-16. For a later `/lessons-pr ../boardroom-breakdown`
> pass at the nexus repo root.
>
> Format per the lessons-pr convention: honest gaps the
> adopter hit; not a rewrite proposal. Nexus's lessons-pr skill
> reads these and decides how to operationalize.

---

## 1. Batch 3 Q4 ("Cadence") doesn't fit non-editorial products

`pre-spec.md` Batch 3 Q4 frames cadence as "how often does the
loop produce new content / records / pages." For an editorial
or content site that fits; for an *application* (boardroom is
an AI-orchestration app, not a publisher) the recommended
answer is technically right but the question itself is doing
no work — there's nothing being published on a schedule.

The "Not applicable" option exists, which is good, but the
question shape pushes the adopter to *re-frame* the question
rather than answer it. Two suggested fixes:

- **Option A:** Make Q4 conditional on the product type. If
  the data architecture answer in Batch 1 is `pure-db` or
  `hybrid-…` with no editorial register implied, surface a
  different Q4 ("what triggers `/iterate`?") instead of
  cadence.
- **Option B:** Reword Q4 generically: "What rhythm does
  `/iterate` follow?" — recommended option remains
  "drain audit findings as found, no fixed cadence", and the
  editorial-cadence options become explicit alternatives for
  content sites.

Option B is the lighter touch.

## 2. Batch 1 Q1 assumes the repo name = the project token

The playbook recommends "use the working name you mentioned in
the pitch — we can rename pre-launch" but doesn't address the
case where the repo dir name already exists and exceeds the
12-char convention. The adopter (us) had to decide whether to
rename the repo dir or split "repo dir" from "project token."

Suggested addition to the playbook: a one-line note in Q1
acknowledging that the repo dir and the working token can
diverge, and pinning that divergence in `bearings.md`.

## 3. `claude-design.prompt.md` location is ambiguous

`customization/visual-system.md` says copy `design-prompt.md`
to `<repo>/claude-design.prompt.md` *or* `design/prompt.md`.
The two locations imply different downstream behavior:

- At repo root: the prompt is a *commission instruction*, not
  a design artifact. Visible at the top level alongside spec.
- Inside `design/`: lives next to the artifacts the prompt
  produces; cleaner once the system has landed.

Recommend the playbook just pick one. Pre-spec is the right
time to commit the file; living it at root keeps it visible
until the design session has run, and the design session can
move (or delete) it as part of the `design: visual system v1`
commit.

## 4. AskUserQuestion is not actually surfaced as a tool in
nexus playbooks

The carve-out in `pre-spec.md` says the agent may use
`AskUserQuestion`, but does not tell the agent how to format
each batch as a single tool call. The asking-well.md doc
covers question *shape*; the carve-out could link to a worked
tool-call example showing all four Batch 1 questions as one
multi-question call (vs. four separate calls).

Worth a small addition to `concepts/asking-well.md`: a
"packaging the batch as one tool call" subsection. Reduces
adopter ambiguity.

## 5. No bridge between `bearings.md` Stack pin and Phase B

The pre-spec interview leaves Stack as "TBD in Phase B." This
is fine, but `customization/visual-system.md` Failure Modes
warns that the design session needs the framework pinned. If
the user commissions design before Phase B's adoption (which
the pre-spec session prompts them to), the design session
will stop and ask. Worth one line in `pre-spec.md` Batch 3:
"If you chose 'commission a visual system,' run Phase B
adoption *before* running the design session — the design
session needs `bearings.md` to have the CSS framework pinned."

---

## Out of scope for lessons-pr

Some gaps we noticed are not actionable against nexus and
should be tracked in this project's own audit instead:

- The hardline UX rule "no more than 5 questions at a
  checkpoint" — that's product policy, not nexus.
- The token-cap-on-LLM-session pattern — that's a v1
  implementation note in `spec.md`, not a nexus gap.
