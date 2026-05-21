// Client-safe constant. Lives separately from lib/anthropic/user-key-client.ts
// because the latter imports server-only modules (Anthropic SDK + the
// supabase server client) and would pull next/headers into the client
// bundle through ByokBanner.

export const BYOK_BANNER_TEXT =
  "You're paying for this session — your Anthropic API key is in use."
