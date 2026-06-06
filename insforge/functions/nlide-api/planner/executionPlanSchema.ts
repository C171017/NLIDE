import { z } from 'npm:zod@3.23.8'
import { EXECUTION_PLAN_VERSION } from '../_shared/translator/executionPlanTypes.ts'

export const ExecutionPhaseSchema = z.object({
  id: z.string().regex(/^PHASE-\d{3}$/),
  order: z.number().int().positive(),
  title: z.string().min(1),
  goal: z.string().min(1),
  taskIds: z.array(z.string().regex(/^T-\d{3}$/)),
  exitCriteria: z.array(z.string().min(1)).min(1),
  blocks: z.array(z.string().regex(/^PHASE-\d{3}$/)).optional(),
})

export const ExecutionPlanLlmSchema = z.object({
  version: z.literal(EXECUTION_PLAN_VERSION),
  summary: z.string().min(1),
  rationale: z.string().optional(),
  phases: z.array(ExecutionPhaseSchema),
})
