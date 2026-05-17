export const MIN_PERSONAS_SEATED = 2
export const MAX_PERSONAS_SEATED = 6
export const MAX_PITCH_WORDS = 600

export const DEMO_PITCH_WORDS = 100
export const DEMO_TURN_COUNT = 3
export const DEMO_AUTO_ADVANCE_MS = 2200

// Per-session token budget. Pinned by bearings.md "Anti-abuse posture".
// Phase 7b's orchestrator wraps the session when this is exhausted; 7a only
// exposes the constant + the BudgetTracker that consumes it.
export const MAX_SESSION_TOKENS = 60_000
