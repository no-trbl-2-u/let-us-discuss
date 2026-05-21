// Accepts either a bare name string (back-compat for older call sites)
// or a persona-shaped object with optional explicit `monogram` override.
// When `monogram` is set in the persona frontmatter (phase 28 addition,
// resolved via persona schema), it wins — lets us break collisions
// like Skeptical Engineer + Secretary both deriving to "SE".
export function monogramFor(
  input: string | { name: string; monogram?: string | undefined },
): string {
  if (typeof input === 'object') {
    if (input.monogram) return input.monogram
    return monogramFromName(input.name)
  }
  return monogramFromName(input)
}

function monogramFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '··'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}
