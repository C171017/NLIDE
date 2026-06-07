import { z } from 'npm:zod@3.23.8'
import { EXECUTION_PLAN_VERSION } from '../_shared/translator/executionPlanTypes.ts'

const UserChecklistKindSchema = z.enum([
  'api_key',
  'decision',
  'approval',
  'config',
  'open_question',
  'other',
])

export const ExecutionChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().optional(),
  kind: UserChecklistKindSchema.optional(),
})

export const ExecutionPhaseSchema = z.object({
  id: z.string().regex(/^PHASE-\d{3}$/),
  order: z.number().int().positive(),
  title: z.string().min(1),
  goal: z.string().min(1),
  humanGateReason: z.string().min(1),
  agentChecklist: z.array(ExecutionChecklistItemSchema).min(1),
  userChecklist: z.array(ExecutionChecklistItemSchema).min(1),
  relatedTaskIds: z.array(z.string().regex(/^T-\d{3}$/)).optional(),
  exitCriteria: z.array(z.string().min(1)).optional(),
  blocks: z.array(z.string().regex(/^PHASE-\d{3}$/)).optional(),
})

export const ExecutionPlanLlmSchema = z.object({
  version: z.literal(EXECUTION_PLAN_VERSION),
  summary: z.string().min(1),
  rationale: z.string().optional(),
  phases: z.array(ExecutionPhaseSchema).min(1),
})
