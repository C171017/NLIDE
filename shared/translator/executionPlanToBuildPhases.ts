import { parseTaskTitles } from './extractEntityIds.ts'
import type { ExecutionPlan } from './executionPlanTypes.ts'
import type { BuildPhase, BuildPhaseStatus } from './types.ts'

export interface ExecutionPlanProgressInput {
  isItemDone: (checklistId: string, itemId: string) => boolean
}

function derivePhaseStatuses(
  phases: BuildPhase[],
  isItemDone: (checklistId: string, itemId: string) => boolean,
): BuildPhase[] {
  let foundActive = false
  return phases.map((phase) => {
    const allDone = phase.jobs.every((job) => isItemDone(phase.checklistId, job.id))
    let status: BuildPhaseStatus
    if (allDone) {
      status = 'done'
    } else if (!foundActive) {
      status = 'active'
      foundActive = true
    } else {
      status = 'upcoming'
    }
    return { ...phase, status }
  })
}

/** Map ExecutionPlan → BuildPhase[] for BuildPhasesPanel reuse. */
export function executionPlanToBuildPhases(
  plan: ExecutionPlan,
  tasksMd: string,
  progress?: ExecutionPlanProgressInput,
): BuildPhase[] {
  const taskTitles = parseTaskTitles(tasksMd)

  const phases: BuildPhase[] = [...plan.phases]
    .sort((a, b) => a.order - b.order)
    .map((phase) => ({
      id: phase.id,
      order: phase.order,
      title: phase.title,
      plainSummary: phase.goal,
      agentModeGoal: phase.exitCriteria.join('; '),
      status: 'upcoming' as BuildPhaseStatus,
      checklistId: phase.id,
      jobs: phase.taskIds.map((taskId) => ({
        id: taskId,
        label: taskTitles.get(taskId) ?? taskId,
        detail: `Assigned to ${phase.title}`,
      })),
    }))

  if (progress) {
    return derivePhaseStatuses(phases, progress.isItemDone)
  }

  if (phases.length > 0) {
    phases[0] = { ...phases[0], status: 'active' }
  }

  return phases
}
