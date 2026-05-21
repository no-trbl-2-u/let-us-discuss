import { loadPersonas } from '@/lib/personas/load'
import {
  DEFAULT_TEMPLATE_SLUG,
  loadDefaultTemplate,
} from '@/lib/templates/load'
import { BoardClient } from './board-client'

type Props = {
  hasUserKey?: boolean
}

export function Board({ hasUserKey = false }: Props) {
  const personas = loadPersonas()
  const template = loadDefaultTemplate()
  const firstPhase = template.phases[0]
  return (
    <BoardClient
      personas={personas}
      templateFirstPhaseName={firstPhase?.name ?? 'Clarify'}
      templateSlug={DEFAULT_TEMPLATE_SLUG}
      hasUserKey={hasUserKey}
    />
  )
}
