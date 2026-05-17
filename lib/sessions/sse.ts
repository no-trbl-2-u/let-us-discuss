import type { SessionEvent } from './events'

// Encodes one SSE message: a single `event:` line, one `data:` line per
// newline in the JSON payload, and the trailing blank line that terminates
// the record. The 7b orchestrator and the 7a not-implemented path both go
// through here.

export function encodeSseEvent(event: SessionEvent): string {
  const json = JSON.stringify(event)
  const dataLines = json
    .split('\n')
    .map((line) => `data: ${line}`)
    .join('\n')
  return `event: ${event.type}\n${dataLines}\n\n`
}

export type ParsedSseRecord = {
  event: string | null
  data: string
}

// Parses a buffer of SSE text into one or more records. Returns the parsed
// records plus any unterminated tail to feed into the next call. Used by
// session-stream.ts on the client.
export function parseSseChunk(buffer: string): {
  records: ParsedSseRecord[]
  rest: string
} {
  const records: ParsedSseRecord[] = []
  let rest = buffer
  while (true) {
    const sep = rest.indexOf('\n\n')
    if (sep === -1) break
    const raw = rest.slice(0, sep)
    rest = rest.slice(sep + 2)
    let event: string | null = null
    const dataLines: string[] = []
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:'))
        dataLines.push(line.slice(5).trimStart())
    }
    if (dataLines.length === 0) continue
    records.push({ event, data: dataLines.join('\n') })
  }
  return { records, rest }
}
