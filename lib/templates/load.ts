import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import { TEMPLATES_DIR } from '@/lib/content/paths'
import { type Template, TemplateSchema } from '@/lib/schemas/template'

export const DEFAULT_TEMPLATE_SLUG = 'pitch-to-spec'

export function loadTemplateFromDir(dir: string, slug: string): Template {
  const full = path.join(dir, `${slug}.json`)
  if (!fs.existsSync(full)) {
    throw new Error(`Template not found: ${slug} (looked for ${full})`)
  }
  const raw = fs.readFileSync(full, 'utf-8')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(
      `Template ${full} is not valid JSON: ${err instanceof Error ? err.message : err}`,
    )
  }
  const result = TemplateSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `Invalid template ${full}:\n${result.error.message}`,
    )
  }
  return result.data
}

export const loadTemplate = cache((slug: string): Template =>
  loadTemplateFromDir(TEMPLATES_DIR, slug),
)

export const loadDefaultTemplate = cache((): Template =>
  loadTemplate(DEFAULT_TEMPLATE_SLUG),
)
