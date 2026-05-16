import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { cache } from 'react'
import { PERSONAS_DIR } from '@/lib/content/paths'
import {
  type Persona,
  PersonaFrontmatterSchema,
  PersonaSchema,
} from '@/lib/schemas/persona'

function readDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
}

export function loadPersonasFromDir(dir: string): Persona[] {
  const files = readDir(dir).sort()
  const personas: Persona[] = []
  for (const file of files) {
    const full = path.join(dir, file)
    const raw = fs.readFileSync(full, 'utf-8')
    const { data, content } = matter(raw)
    const fm = PersonaFrontmatterSchema.safeParse(data)
    if (!fm.success) {
      throw new Error(
        `Invalid persona frontmatter in ${full}:\n${fm.error.message}`,
      )
    }
    const persona = PersonaSchema.safeParse({
      ...fm.data,
      systemPrompt: content.trim(),
    })
    if (!persona.success) {
      throw new Error(
        `Invalid persona body in ${full}:\n${persona.error.message}`,
      )
    }
    personas.push(persona.data)
  }
  return sortPersonas(personas)
}

function sortPersonas(personas: Persona[]): Persona[] {
  return [...personas].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'lead' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export const loadPersonas = cache((): Persona[] =>
  loadPersonasFromDir(PERSONAS_DIR),
)

export function loadPersona(slug: string): Persona {
  const persona = loadPersonas().find((p) => p.slug === slug)
  if (!persona) throw new Error(`Persona not found: ${slug}`)
  return persona
}
