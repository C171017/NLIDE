import { extractEntityIds } from './extractEntityIds.ts'
import type { ExecutionPlan } from './executionPlanTypes.ts'

export interface ExecutionPlanValidationIssue {
  ruleId: string
  message: string
}

export function validateExecutionPlan(
  plan: ExecutionPlan,
  tasksMd: string,
): { ok: true } | { ok: false; issues: ExecutionPlanValidationIssue[] } {
  const issues: ExecutionPlanValidationIssue[] = []
  const expectedTasks = extractEntityIds(tasksMd, 'T')
  const assigned = new Map<string, string>()

  for (const phase of plan.phases) {
    for (const taskId of phase.taskIds) {
      if (!expectedTasks.includes(taskId)) {
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

  for (const taskId of expectedTasks) {
    if (!assigned.has(taskId)) {
      issues.push({
        ruleId: 'missing_task',
        message: `${taskId} in tasks.md is not assigned to any phase`,
      })
    }
  }

  const phaseIds = plan.phases.map((p) => p.id)
  const uniqueIds = new Set(phaseIds)
  if (uniqueIds.size !== phaseIds.length) {
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

  if (expectedTasks.length > 0 && plan.phases.length === 0) {
    issues.push({
      ruleId: 'empty_plan',
      message: 'Plan must have at least one phase when tasks exist',
    })
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true }
}
