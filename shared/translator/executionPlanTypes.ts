export const EXECUTION_PLAN_VERSION = 'v1' as const

export interface ExecutionPhase {
  id: string
  order: number
  title: string
  goal: string
  taskIds: string[]
  exitCriteria: string[]
  blocks?: string[]
}

/** LLM output shape — planVersion assigned server-side after parse. */
export interface ExecutionPlanLlm {
  version: typeof EXECUTION_PLAN_VERSION
  summary: string
  rationale?: string
  phases: ExecutionPhase[]
}

export interface ExecutionPlan extends ExecutionPlanLlm {
  planVersion: string
  generatedAt?: string
  model?: string
}

export interface ExecutionPlanPreviewPayload {
  previewId: string
  plan: ExecutionPlan
  /** tasks.md used when this plan was generated — keeps labels aligned with validation. */
  tasksMd?: string
}

/** JSONB shape in execution_plans / execution_plan_previews (legacy rows may be bare ExecutionPlan). */
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
