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
