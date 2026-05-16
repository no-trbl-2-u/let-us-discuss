import { notFound } from 'next/navigation'
import { loadPersonas } from '@/lib/personas/load'
import { TryClient } from './try-client'

export function TryBoard() {
  const personas = loadPersonas()
  const persona = personas.find((p) => p.slug === 'product-lead')
  if (!persona) {
    // Demo's single persona is missing from the v1 library — surface
    // as 404 rather than render an empty shell. data:validate catches
    // this at CI; production should never see it.
    notFound()
  }
  return <TryClient persona={persona} />
}
