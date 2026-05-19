import type { Persona } from '@framework/schemas/persona'

export class CastGuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CastGuardError'
  }
}

/**
 * Returns the cast augmented to contain exactly one secretary.
 *
 * - If `seated` already contains exactly one secretary, returns it
 *   unchanged.
 * - If `seated` contains zero secretaries, appends the secretary
 *   pulled from `all`.
 * - Throws CastGuardError when `all` doesn't contain exactly one
 *   secretary (a personas/ content bug, not a runtime cast bug).
 * - Throws CastGuardError when `seated` somehow ends up with
 *   multiple secretaries — defensive; the user-facing UI doesn't
 *   let this happen.
 */
export function ensureSecretary(
  seated: Persona[],
  all: Persona[],
): Persona[] {
  const librarySecretaries = all.filter((p) => p.role === 'secretary')
  if (librarySecretaries.length !== 1) {
    throw new CastGuardError(
      `personas/ must contain exactly one secretary; found ${librarySecretaries.length}`,
    )
  }
  const secretary = librarySecretaries[0]!

  const seatedSecretaries = seated.filter((p) => p.role === 'secretary')
  if (seatedSecretaries.length > 1) {
    throw new CastGuardError(
      `cast contains ${seatedSecretaries.length} secretaries; expected at most one`,
    )
  }
  if (seatedSecretaries.length === 1) return seated
  return [...seated, secretary]
}
