const DEFAULT_NEXT = '/app'

export function safeNextPath(input: string | null | undefined): string {
  if (typeof input !== 'string' || input.length === 0) return DEFAULT_NEXT
  // Same-origin paths only: start with "/", not "//" (protocol-
  // relative), not "/\" (Windows-style), no embedded ".." segments.
  if (!input.startsWith('/')) return DEFAULT_NEXT
  if (input.startsWith('//') || input.startsWith('/\\')) return DEFAULT_NEXT
  if (input.includes('://')) return DEFAULT_NEXT
  if (input.split('/').includes('..')) return DEFAULT_NEXT
  return input
}
