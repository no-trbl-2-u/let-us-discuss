Run nexus's pitch-to-adopted flow.

nexus is at ../nexus (or ./.nexus if submoduled). The plan
is: pre-spec interview → write spec.md → adopt nexus.

Phase A — pre-spec interview (30-45 minutes)

Read ../nexus/playbooks/pre-spec.md end-to-end. Read
../nexus/concepts/asking-well.md for question shape. Then
run the three question batches (foundation, spine, surface)
per the playbook. AskUserQuestion is allowed during this
phase — it's pre-spec, not in-skill. Once spec.md is
committed at the end of Phase A, that rule reverts.

Here's my pitch in my own words:

This application is an attempt at breaking the barrier to entry for utilizing AI Agent discussion and spec development. To start, it'll be a "board room" simulator where the user can drag and drop "personas" into a board room, select their "discussion" phases, take a loose pitch, and that's it. What they get out of the conversation is relative to what they asked, but to start, it'll be specs. I see in the future it could be chapter outlines or questionairres for Authors, presentation outlines, etc.

Phase A deliverables (committed before Phase B starts):
  - spec.md (at least one page, persona named, v1 scope)
  - plan/bearings.md stub (Surface, Auth, Stack, hosting,
    voice, hard rules)
  - (optional) claude-design.prompt.md if Batch 3 Q2 landed
    on "commission a visual system" (see
    ../nexus/customization/visual-system.md)
  - (optional) NEXUS_LESSONS.md scratch — capture nexus gaps
    you hit during the interview, for a later /lessons-pr
    pass back to the nexus repo

Phase B — adoption

Once Phase A's commits land, switch to the standard adoption
prompt: read ../nexus/README.md from the TL;DR section
downward, then follow ../nexus/playbooks/new-project.md.
AskUserQuestion is no longer allowed (per nexus's standing
rules — only /oversight may ask). Decide and document; don't
ask.

End-state:
  - chore: adopt nexus methodology commit landed and pushed
  - Day 1 checklist in new-project.md passes
  - Ready for /ship-a-phase as the first conscious step.
  - Do NOT invoke /ship-a-phase yourself; let the user do
    that.

Standing rules:
  - Commit and push as a single atomic act per logical chunk.
  - No Co-Authored-By trailers, no emojis.
  - No --no-verify, no force-push.

Estimated time: 60-90 minutes total. Begin with Phase A.