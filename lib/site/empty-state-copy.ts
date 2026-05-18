/**
 * The bearings standing-decision template for empty-state copy:
 *   "No <thing> yet — <next action>."
 *
 * The dash is an em-dash; trailing period is required.
 * Surfaces consume this regex via the empty-state audit test
 * (lib/site/__tests__/empty-state-audit.test.tsx) — drift in
 * the live components trips the gate.
 */
export const EMPTY_STATE_TEMPLATE_RE = /^No .+ yet — .+\.$/
