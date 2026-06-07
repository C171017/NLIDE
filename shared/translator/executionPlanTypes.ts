export const EXECUTION_PLAN_VERSION = 'v2' as const
export const LEGACY_EXECUTION_PLAN_VERSION = 'v1' as const

export type ExecutionPlanVersion =
  | typeof EXECUTION_PLAN_VERSION
  | typeof LEGACY_EXECUTION_PLAN_VERSION

export type UserChecklistKind =
  | 'api_key'
  | 'decision'
  | 'approval'
  | 'config'
  | 'open_question'
  | 'other'

export interface ExecutionChecklistItem {
  id: string
  label: string
  detail?: string
  /** User checklist items only — why the human must act. */
  kind?: UserChecklistKind
}

export interface ExecutionPhase {
  id: string
  order: number
  title: string
  goal: string
  humanGateReason: string
  agentChecklist: ExecutionChecklistItem[]
  userChecklist: ExecutionChecklistItem[]
  relatedTaskIds?: string[]
  exitCriteria?: string[]
  blocks?: string[]
  /** @deprecated v1 plans only */
  taskIds?: string[]
}

/** LLM output shape — planVersion assigned server-side after parse. */
export interface ExecutionPlanLlm {
  version: ExecutionPlanVersion
  summary: string
  rationale?: string
  phases: ExecutionPhase[]
}

export interface ExecutionPlan extends ExecutionPlanLlm {
  planVersion: string
  generatedAt?: string
  model?: string
}

export function isLegacyExecutionPlan(plan: ExecutionPlan | ExecutionPlanLlm): boolean {
  return plan.version === LEGACY_EXECUTION_PLAN_VERSION
}

export function isLegacyExecutionPhase(phase: ExecutionPhase): boolean {
  return (
    Array.isArray(phase.taskIds) &&
    phase.taskIds.length > 0 &&
    (!phase.agentChecklist?.length || !phase.humanGateReason)
  )
}

export interface ExecutionPlanPreviewPayload {
  previewId: string
  plan: ExecutionPlan
  tasksMd?: string
}

export interface ExecutionPlanStoredPayload {
  plan: ExecutionPlan
  tasksMd?: string
}

export interface ExecutionPlanState {
  committed: ExecutionPlan | null
  committedTasksMd?: string | null
  preview: ExecutionPlanPreviewPayload | null
}

export interface ExecutionPlanValidationIssue {
  ruleId: string
  message: string
}
