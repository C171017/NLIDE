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
  goldenPrompts: GoldenPrompt[]
  goldenPassBar: GoldenPassBar
}

/** Expected router output for one golden test case (Phase 1 contract). */
export interface GoldenPromptExpectation {
  intentType: RouterIntentType
  /** Spec files that must appear in operations[].target */
  operationTargets: string[]
  /** Entity IDs that must appear when set (e.g. F-001, T-001) */
  entityIds?: string[]
  /** open_questions[] must be empty unless intent is clarify */
  openQuestionsEmpty?: boolean
  mustNot?: {
    intentTypes?: RouterIntentType[]
    operationTargets?: string[]
  }
  notes?: string
}

export interface GoldenPrompt {
  id: string
  /** Simulated NLIDE canvas chat message */
  message: string
  /** Where this example came from */
  source: string
  expectation: GoldenPromptExpectation
}

export interface GoldenPassBar {
  /** Minimum passing cases out of goldenPrompts.length */
  minPass: number
  description: string
}
