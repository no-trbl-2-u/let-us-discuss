import { loadPersonas } from '@/lib/personas/load'
import {
  DEFAULT_TEMPLATE_SLUG,
  loadDefaultTemplate,
} from '@/lib/templates/load'
import { BoardClient } from './board-client'

export function Board() {
  const personas = loadPersonas()
  const template = loadDefaultTemplate()
  const firstPhase = template.phases[0]
  return (
    <BoardClient
      personas={personas}
      templateFirstPhaseName={firstPhase?.name ?? 'Clarify'}
      templateSlug={DEFAULT_TEMPLATE_SLUG}
    />
  )
}
