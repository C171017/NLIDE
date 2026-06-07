import { z } from 'npm:zod@3.23.8'
import { SPEC_FILE_ALLOWLIST } from '../_shared/translator/intentTypes.ts'
import type { RouterPlan } from '../_shared/translator/types.ts'

const ROUTER_INTENT_TYPE_VALUES = [
  'add_feature',
  'update_feature',
  'add_task',
  'update_task',
  'update_product',
  'update_architecture',
  'add_constraint',
  'add_decision',
  'clarify',
  'noop',
] as const

export const RouterOperationSchema = z.object({
  target: z.string(),
  action: z.enum(['add', 'update']),
  entity_id: z.string().optional(),
})

export const RouterPlanSchema = z
  .object({
    intent_type: z.enum(ROUTER_INTENT_TYPE_VALUES),
    summary: z.string().min(1),
    operations: z.array(RouterOperationSchema),
    canvas_ops: z.array(z.record(z.unknown())).default([]),
    open_questions: z.array(z.string()),
  })
  .strict()

export interface RouterValidationIssue {
  path: string
  message: string
}

export type RouterParseResult =
  | { ok: true; plan: RouterPlan }
  | { ok: false; code: 'router_invalid_json'; message: string }
  | { ok: false; code: 'router_validation_failed'; message: string; zodIssues: RouterValidationIssue[] }

export function extractJsonFromLlmText(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() ?? trimmed
  return JSON.parse(candidate)
}

function applyBusinessRules(plan: RouterPlan): RouterValidationIssue[] {
  const issues: RouterValidationIssue[] = []

  for (const [index, op] of plan.operations.entries()) {
    if (!SPEC_FILE_ALLOWLIST.includes(op.target)) {
      issues.push({
        path: `operations[${index}].target`,
        message: `target must be in spec allowlist, got ${op.target}`,
      })
    }
  }

  if (plan.intent_type === 'noop') {
    if (plan.operations.length > 0) {
      issues.push({ path: 'operations', message: 'noop must have empty operations[]' })
    }
    if (plan.open_questions.length > 0) {
      issues.push({ path: 'open_questions', message: 'noop must have empty open_questions[]' })
    }
  }

  if (plan.intent_type === 'clarify') {
    const badTargets = plan.operations
      .map((op) => op.target)
      .filter((target) => target !== 'open-questions.md')
    if (badTargets.length > 0) {
      issues.push({
        path: 'operations',
        message: `clarify must only target open-questions.md, also saw ${badTargets.join(', ')}`,
      })
    }
    if (plan.open_questions.length === 0) {
      issues.push({ path: 'open_questions', message: 'clarify requires non-empty open_questions[]' })
    }
  }

  const addOpsByTarget = new Map<string, string[]>()
  for (const [index, op] of plan.operations.entries()) {
    if (op.action !== 'add') continue
    const ids = addOpsByTarget.get(op.target) ?? []
    if (op.entity_id) {
      if (ids.includes(op.entity_id)) {
        issues.push({
          path: `operations[${index}].entity_id`,
          message: `duplicate entity_id ${op.entity_id} for ${op.target} add operations`,
        })
      }
      ids.push(op.entity_id)
    }
    addOpsByTarget.set(op.target, ids)
  }

  const createCardCount = plan.canvas_ops.filter((op) => op.action === 'create_card').length
  if (createCardCount >= 2 && plan.operations.length === 0) {
    console.warn(
      '[router] compound canvas_ops with empty operations[] — writers may lack spec targets',
    )
  }

  return issues
}

export function parseRouterPlanFromLlmText(text: string): RouterParseResult {
  let parsed: unknown
  try {
    parsed = extractJsonFromLlmText(text)
  } catch (error) {
    return {
      ok: false,
      code: 'router_invalid_json',
      message: error instanceof Error ? error.message : 'Invalid JSON from router LLM',
    }
  }

  const result = RouterPlanSchema.safeParse(parsed)
  if (!result.success) {
    return {
      ok: false,
      code: 'router_validation_failed',
      message: 'Router output failed schema validation',
      zodIssues: result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    }
  }

  const plan: RouterPlan = {
    ...result.data,
    canvas_ops: result.data.canvas_ops ?? [],
  }

  const businessIssues = applyBusinessRules(plan)
  if (businessIssues.length > 0) {
    return {
      ok: false,
      code: 'router_validation_failed',
      message: 'Router output failed business rules',
      zodIssues: businessIssues,
    }
  }

  return { ok: true, plan }
}
