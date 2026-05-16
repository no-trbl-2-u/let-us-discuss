import { z } from 'zod'

export const PersonaRoleSchema = z.enum(['lead', 'specialist'])
export type PersonaRole = z.infer<typeof PersonaRoleSchema>

export const PersonaFrontmatterSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, 'slug must be kebab-case'),
  name: z.string().min(2).max(80),
  role: PersonaRoleSchema,
  voice: z.string().min(4).max(200),
  lead: z.boolean(),
  tools: z.array(z.string().min(1)).default([]),
  summary: z.string().min(8).max(200),
})

export type PersonaFrontmatter = z.infer<typeof PersonaFrontmatterSchema>

export const PersonaSchema = PersonaFrontmatterSchema.extend({
  systemPrompt: z.string().min(40),
})

export type Persona = z.infer<typeof PersonaSchema>
