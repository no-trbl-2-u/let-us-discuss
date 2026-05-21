// Voice contract — the load-bearing canonical phrasings the recent
// /iterate sweep (passes 12-14) re-discovered four times across
// parallel surfaces. Centralizing here so the voice contract stops
// being load-bearing on human re-discovery; the drift test at
// lib/site/__tests__/voice-canon.test.ts fails the verify gate when
// any retired phrasing reappears in shipped source.
//
// Pure constants module. No runtime behavior; importable from server
// + client surfaces equally.

/**
 * The clarify-phase user-answer constraint, canonical after #34
 * (`91090dd`), #46 (`4de29b4`), and #51 (`cd94020`). Every shipped
 * surface that names this constraint should compose from this
 * phrase.
 */
export const ANSWER_SHAPE_PHRASE =
  'one-word or one-sentence clarifying questions'

/**
 * The post-phase-21 cast framing, canonical after #37 (`baa28ea`).
 * Names the four conferring personas + Secretary as a single group
 * with structural distinction.
 */
export const CAST_GROUPING_PHRASE =
  'four conferring personas plus a Secretary who keeps the log'

/**
 * The "v1" antecedent replacement, canonical after #35 (`163787c`).
 * Used in noun-phrase contexts ("the starter library").
 */
export const STARTER_LIBRARY_NOUN = 'starter library'

/**
 * Retirement ledger for the voice contract. Each entry names a
 * retired phrasing the /critique loop (or earlier /iterate ticks)
 * surfaced as drift, along with the commit that retired it and the
 * one-line reason. The drift test at
 * `lib/site/__tests__/voice-canon.test.ts` source-scans the shipped
 * tree and fails the verify gate when any of these reappear.
 *
 * Adding a new entry: append one row with the literal retired
 * phrase, the short commit SHA that retired it, and a one-clause
 * reason. The test loops over the array; no other change needed.
 */
export type RetiredPhrase = {
  phrase: string
  retiredAt: string
  reason: string
}

export const OUTDATED_VOICE_SHAPES: readonly RetiredPhrase[] = [
  {
    phrase: 'one-word questions at the checkpoints',
    retiredAt: '91090dd',
    reason: 'pre-canonical ANSWER_SHAPE_PHRASE',
  },
  {
    phrase: 'the v1 library',
    retiredAt: '163787c',
    reason: 'STARTER_LIBRARY_NOUN supersedes; "v1" had no antecedent',
  },
  {
    phrase: 'these four',
    retiredAt: 'baa28ea',
    reason: 'post-phase-21 cast count drifted; CAST_GROUPING_PHRASE supersedes',
  },
  {
    phrase: 'demo · locked',
    retiredAt: '7b7d58e',
    reason: 'gated-tile label implied a paywall',
  },
  {
    phrase: 'sign in to seat',
    retiredAt: 'd7a3054',
    reason: 'visible badge collapsed to "empty" (aria-label keeps the cue)',
  },
  {
    phrase: 'cast guard',
    retiredAt: 'b2b9de9',
    reason: 'internal jargon on user-facing copy',
  },
  {
    phrase: 'Plain version:',
    retiredAt: '738b0f3',
    reason: 'primed a legal counterpart neither legal page provides',
  },
  {
    phrase: 'Drag two to six personas',
    retiredAt: 'd24e362',
    reason: 'contradicts the post-phase-21 cast count',
  },
  {
    phrase: 'board-room table',
    retiredAt: 'a24cfaf',
    reason: 'one-word "boardroom" is the branded form (substrate docs keep the hyphen)',
  },
]
