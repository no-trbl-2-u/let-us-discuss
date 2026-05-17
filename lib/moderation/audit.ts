import type { SupabaseServerClient } from '@/lib/supabase/server'
import type { ModerationSurface, ModerationVerdict } from './client'

export type WriteFlagAuditInput = {
  sessionId: string
  surface: ModerationSurface
  text: string
  verdict: ModerationVerdict
}

// Best-effort: a failed insert is logged but not propagated. The point of
// the audit row is retrospective review; failing the user request because
// the audit write hit a transient DB hiccup would be the wrong default.
export async function writeFlagAudit(
  supabase: SupabaseServerClient,
  input: WriteFlagAuditInput,
): Promise<void> {
  try {
    const { error } = await supabase.from('flag_audit').insert({
      session_id: input.sessionId,
      surface: input.surface,
      text: input.text,
      verdict: input.verdict as unknown as never,
    })
    if (error) {
      // biome-ignore lint/suspicious/noConsole: surfacing for log scrape
      console.warn(`[moderation/audit] insert failed: ${error.message}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // biome-ignore lint/suspicious/noConsole: surfacing for log scrape
    console.warn(`[moderation/audit] exception: ${message}`)
  }
}
