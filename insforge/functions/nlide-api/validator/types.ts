import type { RouterPlan } from '../_shared/translator/types.ts'

export type ValidatorMode = 'preview' | 'commit'

export interface ValidatorIssue {
  ruleId: string
  severity: 'block' | 'warn'
  file?: string
  entityId?: string
  message: string
  blocksPreview: boolean
  blocksCommit: boolean
}

export interface ValidateSpecInput {
  spec: Record<string, string>
  routerPlan?: RouterPlan
  mode: ValidatorMode
}

export type ValidateSpecResult =
  | {
      ok: true
      issues: ValidatorIssue[]
      warnings: ValidatorIssue[]
      blocksPreview: false
      blocksCommit: boolean
    }
  | {
      ok: false
      issues: ValidatorIssue[]
      warnings: ValidatorIssue[]
      blocksPreview: boolean
      blocksCommit: boolean
    }
