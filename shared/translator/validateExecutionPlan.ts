import { extractEntityIds } from './extractEntityIds.ts'
import type { ExecutionPlan, ExecutionPlanValidationIssue } from './executionPlanTypes.ts'
import { isLegacyExecutionPhase, isLegacyExecutionPlan } from './executionPlanTypes.ts'

export type { ExecutionPlanValidationIssue }

const CHECKLIST_ID_PREFIX = /^(A|U)-\d{3}$/

function collectChecklistIds(plan: ExecutionPlan): string[] {
  const ids: string[] = []
  for (const phase of plan.phases) {
    if (isLegacyExecutionPhase(phase)) continue
    for (const item of phase.agentChecklist ?? []) {
      ids.push(`${phase.id}:agent:${item.id}`)
    }
    for (const item of phase.userChecklist ?? []) {
      ids.push(`${phase.id}:user:${item.id}`)
    }
  }
  return ids
}

/** v2: structural validity. v1 legacy: orphan task IDs only. */
export function isPlanDisplayable(plan: ExecutionPlan, tasksMd: string): boolean {
  return validateExecutionPlan(plan, tasksMd).ok
}

/** @deprecated Use isPlanDisplayable */
export function isPlanAlignedWithTasks(plan: ExecutionPlan, tasksMd: string): boolean {
  return isPlanDisplayable(plan, tasksMd)
}

export function validateExecutionPlan(
  plan: ExecutionPlan,
  tasksMd: string,
): { ok: true; warnings: ExecutionPlanValidationIssue[] } | { ok: false; issues: ExecutionPlanValidationIssue[] } {
  const issues: ExecutionPlanValidationIssue[] = []
  const warnings: ExecutionPlanValidationIssue[] = []

  if (isLegacyExecutionPlan(plan)) {
    return validateLegacyExecutionPlan(plan, tasksMd)
  }

  const checklistIds = collectChecklistIds(plan)
  const uniqueChecklist = new Set(checklistIds)
  if (uniqueChecklist.size !== checklistIds.length) {
    issues.push({
      ruleId: 'duplicate_checklist_id',
      message: 'Duplicate checklist item IDs across the plan',
    })
  }

  for (const phase of plan.phases) {
    for (const item of phase.agentChecklist ?? []) {
      if (!CHECKLIST_ID_PREFIX.test(item.id)) {
        warnings.push({
          ruleId: 'checklist_id_format',
          message: `${item.id} in ${phase.id} agentChecklist should match A-001 pattern`,
        })
      }
    }
    for (const item of phase.userChecklist ?? []) {
      if (!CHECKLIST_ID_PREFIX.test(item.id)) {
        warnings.push({
          ruleId: 'checklist_id_format',
          message: `${item.id} in ${phase.id} userChecklist should match U-001 pattern`,
        })
      }
    }

    for (const taskId of phase.relatedTaskIds ?? []) {
      const expectedTasks = extractEntityIds(tasksMd, 'T')
      if (expectedTasks.length > 0 && !expectedTasks.includes(taskId)) {
        warnings.push({
          ruleId: 'orphan_related_task',
          message: `${taskId} in ${phase.id} relatedTaskIds is not defined in tasks.md`,
        })
      }
    }
  }

  const phaseIds = plan.phases.map((p) => p.id)
  const uniquePhaseIds = new Set(phaseIds)
  if (uniquePhaseIds.size !== phaseIds.length) {
    issues.push({ ruleId: 'duplicate_phase_id', message: 'Duplicate phase IDs in plan' })
  }

  const orders = plan.phases.map((p) => p.order).sort((a, b) => a - b)
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      issues.push({
        ruleId: 'phase_order',
        message: 'Phase order must be sequential starting at 1',
      })
      break
    }
  }

  if (plan.phases.length === 0) {
    issues.push({
      ruleId: 'empty_plan',
      message: 'Plan must have at least one phase',
    })
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true, warnings }
}

function validateLegacyExecutionPlan(
  plan: ExecutionPlan,
  tasksMd: string,
): { ok: true; warnings: ExecutionPlanValidationIssue[] } | { ok: false; issues: ExecutionPlanValidationIssue[] } {
  const issues: ExecutionPlanValidationIssue[] = []
  const warnings: ExecutionPlanValidationIssue[] = []
  const expectedTasks = extractEntityIds(tasksMd, 'T')
  const assigned = new Map<string, string>()

  for (const phase of plan.phases) {
    for (const taskId of phase.taskIds ?? []) {
      if (expectedTasks.length > 0 && !expectedTasks.includes(taskId)) {
        issues.push({
          ruleId: 'orphan_task',
          message: `${taskId} in ${phase.id} is not defined in tasks.md`,
        })
      }
      if (assigned.has(taskId)) {
        issues.push({
          ruleId: 'duplicate_task',
          message: `${taskId} assigned to both ${assigned.get(taskId)} and ${phase.id}`,
        })
      } else {
        assigned.set(taskId, phase.id)
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true, warnings }
}
