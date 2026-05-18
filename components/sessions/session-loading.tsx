import { Skeleton } from '@/design/primitives/skeleton'

/**
 * Skeleton matching the ArtifactPreviewGrid shape so the
 * /app/sessions/[id] route shows structure before the DB
 * read resolves.
 */
export function SessionLoading() {
  return (
    <section
      aria-label="Loading session"
      className="flex flex-col gap-[var(--space-5)]"
    >
      <Skeleton className="h-[28px] w-[60%]" />
      <Skeleton className="h-[18px] w-[40%]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)]">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </section>
  )
}
