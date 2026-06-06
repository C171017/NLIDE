import type { RouterOperation, RouterPlan } from '../_shared/translator/types.ts'

export interface WriteFeaturesInput {
  userMessage: string
  routerPlan: RouterPlan
  /** Existing F-xxx IDs in features.md (for add ID allocation). */
  existingFeatureIds?: string[]
  /** Current markdown section when updating an existing feature. */
  existingSection?: string
}

export type WriteFeaturesErrorCode =
  | 'writer_unconfigured'
  | 'writer_no_features_op'
  | 'writer_invalid_output'
  | 'writer_validation_failed'
  | 'writer_upstream_error'

export type WriteFeaturesResult =
  | {
      ok: true
      section: string
      entityId: string
      action: 'add' | 'update'
      model: string
    }
  | {
      ok: false
      error: {
        code: WriteFeaturesErrorCode
        message: string
        validationIssues?: string[]
      }
    }

export function findFeaturesOperation(plan: RouterPlan): RouterOperation | undefined {
  return plan.operations.find((op) => op.target === 'features.md')
}

export function findTasksOperation(plan: RouterPlan): RouterOperation | undefined {
  return plan.operations.find((op) => op.target === 'tasks.md')
}

export function findOperation(plan: RouterPlan, target: string): RouterOperation | undefined {
  return plan.operations.find((op) => op.target === target)
}

export interface WriteTaskInput {
  userMessage: string
  routerPlan: RouterPlan
  existingTaskIds?: string[]
  existingSection?: string
  /** F-xxx from paired features writer on same router turn. */
  linkedFeatureId?: string
}

export type WriteTaskErrorCode =
  | 'writer_unconfigured'
  | 'writer_no_tasks_op'
  | 'writer_invalid_output'
  | 'writer_validation_failed'
  | 'writer_upstream_error'

export type WriteTaskResult =
  | {
      ok: true
      section: string
      entityId: string
      featureId: string
      action: 'add' | 'update'
      model: string
    }
  | {
      ok: false
      error: {
        code: WriteTaskErrorCode
        message: string
        validationIssues?: string[]
      }
    }

export interface WriteRemainingInput {
  userMessage: string
  routerPlan: RouterPlan
  targetFile: string
  existingContent?: string
  existingEntityIds?: string[]
}

export type WriteRemainingResult =
  | {
      ok: true
      section: string
      targetFile: string
      entityId?: string
      action: 'add' | 'update'
      model: string
    }
  | {
      ok: false
      error: {
        code: string
        message: string
        validationIssues?: string[]
      }
    }

export interface WriterPatch {
  file: string
  action: 'add' | 'update'
  anchor?: string
  section: string
  entityId?: string
}

export interface RunWritersInput {
  userMessage: string
  routerPlan: RouterPlan
  existingSpec?: Record<string, string>
  existingFeatureIds?: string[]
  existingTaskIds?: string[]
  existingDecisionIds?: string[]
  existingOpenQuestionIds?: string[]
}

export type RunWritersResult =
  | {
      ok: true
      patches: WriterPatch[]
      models: string[]
    }
  | {
      ok: false
      error: {
        code: string
        message: string
        validationIssues?: string[]
        failedWriter?: string
      }
    }
