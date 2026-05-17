import type { SessionListItem as Item } from '@/lib/sessions/queries'
import { SessionEmpty } from './session-empty'
import { SessionListItem } from './session-list-item'

type Props = {
  items: Item[]
}

export function SessionList({ items }: Props) {
  if (items.length === 0) return <SessionEmpty />
  return (
    <ul
      aria-label="past sessions"
      className="flex flex-col gap-[var(--space-4)] list-none p-0"
    >
      {items.map((item) => (
        <li key={item.id}>
          <SessionListItem item={item} />
        </li>
      ))}
    </ul>
  )
}
