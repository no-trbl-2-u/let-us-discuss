import { z } from 'zod'

export const TemplatePhaseSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(2).max(80),
  description: z.string().min(8).max(400),
  lead_round_max_questions: z.number().int().min(1).max(8).optional(),
  turn_budget: z.number().int().min(1).max(60).optional(),
  exec_summary_checkpoint: z.boolean().optional(),
  retro_review_recent_n: z.number().int().min(1).max(20).optional(),
})

export type TemplatePhase = z.infer<typeof TemplatePhaseSchema>

export const TemplateEscalationSchema = z.object({
  exec_summary_checkpoint: z.boolean(),
  convergence_min_agreement: z.number().min(0).max(1),
  user_redirect_max: z.number().int().min(0).max(5),
})

export type TemplateEscalation = z.infer<typeof TemplateEscalationSchema>

export const TemplateSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*[a-z0-9]$/),
  name: z.string().min(2).max(80),
  description: z.string().min(8).max(400),
  phases: z.array(TemplatePhaseSchema).min(2),
  escalation: TemplateEscalationSchema,
})

export type Template = z.infer<typeof TemplateSchema>
