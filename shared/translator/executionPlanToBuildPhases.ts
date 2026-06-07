import { parseTaskTitles } from './extractEntityIds.ts'
import type { ExecutionPlan, ExecutionPhase } from './executionPlanTypes.ts'
import { isLegacyExecutionPhase } from './executionPlanTypes.ts'
import type { BuildJob, BuildPhase, BuildPhaseStatus } from './types.ts'
import { allPhaseJobs } from './types.ts'

export interface ExecutionPlanProgressInput {
  isItemDone: (checklistId: string, itemId: string) => boolean
}

export const AGENT_JOB_PREFIX = 'agent:'
export const USER_JOB_PREFIX = 'user:'

export function toAgentJobId(itemId: string): string {
  return `${AGENT_JOB_PREFIX}${itemId}`
}

export function toUserJobId(itemId: string): string {
  return `${USER_JOB_PREFIX}${itemId}`
}

function mapChecklistToJobs(
  items: ExecutionPhase['agentChecklist'] | ExecutionPhase['userChecklist'],
  prefix: typeof AGENT_JOB_PREFIX | typeof USER_JOB_PREFIX,
): BuildJob[] {
  return (items ?? []).map((item) => ({
    id: `${prefix}${item.id}`,
    label: item.label,
    detail: item.detail,
  }))
}

function derivePhaseStatuses(
  phases: BuildPhase[],
  isItemDone: (checklistId: string, itemId: string) => boolean,
): BuildPhase[] {
  let foundActive = false
  return phases.map((phase) => {
    const allDone = allPhaseJobs(phase).every((job) =>
      isItemDone(phase.checklistId, job.id),
    )
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

function mapV2Phase(phase: ExecutionPhase): BuildPhase {
  return {
    id: phase.id,
    order: phase.order,
    title: phase.title,
    plainSummary: phase.goal,
    agentModeGoal: phase.exitCriteria?.join('; ') ?? phase.goal,
    status: 'upcoming',
    checklistId: phase.id,
    humanGateReason: phase.humanGateReason,
    agentJobs: mapChecklistToJobs(phase.agentChecklist, AGENT_JOB_PREFIX),
    userJobs: mapChecklistToJobs(phase.userChecklist, USER_JOB_PREFIX),
  }
}

function mapLegacyPhase(phase: ExecutionPhase, tasksMd: string): BuildPhase {
  const taskTitles = parseTaskTitles(tasksMd)
  const taskIds = phase.taskIds ?? []
  return {
    id: phase.id,
    order: phase.order,
    title: phase.title,
    plainSummary: phase.goal,
    agentModeGoal: phase.exitCriteria?.join('; ') ?? phase.goal,
    status: 'upcoming',
    checklistId: phase.id,
    agentJobs: taskIds.map((taskId) => ({
      id: toAgentJobId(taskId),
      label: taskTitles.get(taskId) ?? taskId,
      detail: `Assigned to ${phase.title}`,
    })),
    userJobs: [],
  }
}

/** Map ExecutionPlan → BuildPhase[] for BuildPhasesPanel. */
export function executionPlanToBuildPhases(
  plan: ExecutionPlan,
  tasksMd: string,
  progress?: ExecutionPlanProgressInput,
): BuildPhase[] {
  const phases: BuildPhase[] = [...plan.phases]
    .sort((a, b) => a.order - b.order)
    .map((phase) =>
      isLegacyExecutionPhase(phase) ? mapLegacyPhase(phase, tasksMd) : mapV2Phase(phase),
    )

  if (progress) {
    return derivePhaseStatuses(phases, progress.isItemDone)
  }

  if (phases.length > 0) {
    phases[0] = { ...phases[0], status: 'active' }
  }

  return phases
}
