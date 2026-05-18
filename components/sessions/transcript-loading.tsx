import { Skeleton } from '@/design/primitives/skeleton'

/**
 * Skeleton matching the LiveTranscript shape (44px gutter
 * + body rows) so the transcript route shows structure
 * before turns load.
 */
export function TranscriptLoading() {
  return (
    <section
      aria-label="Loading transcript"
      className="flex flex-col gap-[var(--space-5)]"
    >
      <Skeleton className="h-[28px] w-[40%]" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[44px_minmax(0,1fr)] gap-[var(--space-4)] py-[var(--space-4)]"
        >
          <Skeleton className="h-[44px] w-[44px]" />
          <div className="flex flex-col gap-[var(--space-3)]">
            <Skeleton className="h-[14px] w-[30%]" />
            <Skeleton className="h-[14px] w-full" />
            <Skeleton className="h-[14px] w-[85%]" />
          </div>
        </div>
      ))}
    </section>
  )
}
