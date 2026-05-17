import type { AnswerInput } from '@/lib/anthropic/conferring'

// Module-level Map keyed by sessionId. Each entry is the resolver for the
// orchestrator's current awaitAnswer promise. Single-instance Vercel v1;
// surviving a worker restart is out of scope — the answer route returns 409
// when the entry is missing and the client surfaces a "session interrupted"
// toast.

type Entry = {
  resolve: (answer: AnswerInput) => void
  reject: (err: Error) => void
}

const map = new Map<string, Entry>()

export function registerResume(sessionId: string, entry: Entry): void {
  map.set(sessionId, entry)
}

export function clearResume(sessionId: string): void {
  map.delete(sessionId)
}

export function deliverAnswer(sessionId: string, answer: AnswerInput): boolean {
  const entry = map.get(sessionId)
  if (!entry) return false
  map.delete(sessionId)
  entry.resolve(answer)
  return true
}

export function failResume(sessionId: string, err: Error): boolean {
  const entry = map.get(sessionId)
  if (!entry) return false
  map.delete(sessionId)
  entry.reject(err)
  return true
}

// Returns a fresh promise that resolves when deliverAnswer is called with
// the matching sessionId. The orchestrator awaits this at every checkpoint.
export function waitForAnswer(sessionId: string): Promise<AnswerInput> {
  return new Promise<AnswerInput>((resolve, reject) => {
    // If a previous waiter for this session is still hanging, reject it so
    // the orchestrator doesn't double-resolve.
    failResume(sessionId, new Error('superseded by new waiter'))
    registerResume(sessionId, { resolve, reject })
  })
}

// Test-only escape hatch.
export function _resetForTests(): void {
  for (const [, entry] of map) entry.reject(new Error('reset'))
  map.clear()
}
