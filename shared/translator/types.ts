/** Shared translator instruction spec — used by frontend UI and nlide-api. */

export type BuildPhaseStatus = 'done' | 'active' | 'upcoming'

export interface BuildJob {
  id: string
  label: string
  detail?: string
}

export interface BuildPhase {
  id: string
  order: number
  title: string
  plainSummary: string
  /** What to tell Agent mode to implement when this phase's jobs are complete. */
  agentModeGoal: string
  status: BuildPhaseStatus
  checklistId: string
  jobs: BuildJob[]
}

/** **[USER]** locked v0 (2026-06-06) — ten router buckets; may revise before Phase 2 router ship. */
export type RouterIntentType =
  | 'add_feature'
  | 'update_feature'
  | 'add_task'
  | 'update_task'
  | 'update_product'
  | 'update_architecture'
  | 'add_constraint'
  | 'add_decision'
  | 'clarify'
  | 'noop'

export interface RouterIntentTypeDef {
  intentType: RouterIntentType
  plainName: string
  summary: string
  specTargets: string[]
  example?: string
}

export interface TranslatorSpec {
  version: string
  intentTypes: RouterIntentTypeDef[]
  routingRules: string[]
  specFileAllowlist: string[]
  schemaFields: string[]
  buildPhases: BuildPhase[]
}
