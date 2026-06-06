import { isLikelyWeakCriterion } from '../_shared/translator/acceptanceCriteriaBar.ts'
import {
  countAcceptanceCriteria,
  countTaskInstructions,
  parseFeatureIdFromSection,
  parseTaskFeatureId,
  parseTaskIdFromSection,
} from '../writers/schema.ts'
import type { ValidateSpecInput, ValidateSpecResult, ValidatorIssue } from './types.ts'

function extractEntitySections(content: string, prefix: string): string[] {
  const pattern = new RegExp(`### ${prefix}-\\d{3}:[\\s\\S]*?(?=\\n### ${prefix}-\\d{3}:|$)`, 'g')
  return content.match(pattern) ?? []
}

function extractIds(content: string, prefix: string): string[] {
  const pattern = new RegExp(`### (${prefix}-\\d{3}):`, 'g')
  const ids: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    ids.push(match[1])
  }
  return ids
}

function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id)
    seen.add(id)
  }
  return [...dupes]
}

function parseCriteriaLines(section: string): string[] {
  const block = section.match(/- \*\*Acceptance criteria:\*\*\s*\n((?:  - .+\n?)+)/i)
  if (!block) return []
  return (block[1].match(/^\s*- (.+)$/gm) ?? []).map((line) => line.replace(/^\s*- /, '').trim())
}

function issue(
  ruleId: string,
  message: string,
  options: {
    severity: 'block' | 'warn'
    blocksPreview: boolean
    blocksCommit: boolean
    file?: string
    entityId?: string
  },
): ValidatorIssue {
  return {
    ruleId,
    severity: options.severity,
    message,
    file: options.file,
    entityId: options.entityId,
    blocksPreview: options.blocksPreview,
    blocksCommit: options.blocksCommit,
  }
}

/** Non-LLM spec validator — Phase 4 implementation per validatorStrictness.ts. */
export function validateSpec(input: ValidateSpecInput): ValidateSpecResult {
  const issues: ValidatorIssue[] = []
  const featuresContent = input.spec['features.md'] ?? ''
  const tasksContent = input.spec['tasks.md'] ?? ''

  const featureIds = extractIds(featuresContent, 'F')
  const taskIds = extractIds(tasksContent, 'T')
  const featureSections = extractEntitySections(featuresContent, 'F')
  const taskSections = extractEntitySections(tasksContent, 'T')

  for (const dupe of findDuplicateIds(featureIds)) {
    issues.push(
      issue(`val-dup-feature-id`, `Duplicate feature ID ${dupe}`, {
        severity: 'block',
        blocksPreview: true,
        blocksCommit: true,
        file: 'features.md',
        entityId: dupe,
      }),
    )
  }

  for (const dupe of findDuplicateIds(taskIds)) {
    issues.push(
      issue(`val-dup-task-id`, `Duplicate task ID ${dupe}`, {
        severity: 'block',
        blocksPreview: true,
        blocksCommit: true,
        file: 'tasks.md',
        entityId: dupe,
      }),
    )
  }

  const featureIdSet = new Set(featureIds)

  for (const section of taskSections) {
    const taskId = parseTaskIdFromSection(section)
    const featureId = parseTaskFeatureId(section)

    if (!featureId) {
      issues.push(
        issue('val-orphan-task-feature', `Task ${taskId} missing Feature link`, {
          severity: 'block',
          blocksPreview: true,
          blocksCommit: true,
          file: 'tasks.md',
          entityId: taskId ?? undefined,
        }),
      )
    } else if (!featureIdSet.has(featureId)) {
      issues.push(
        issue(
          'val-orphan-task-feature',
          `Task ${taskId} links missing feature ${featureId}`,
          {
            severity: 'block',
            blocksPreview: true,
            blocksCommit: true,
            file: 'tasks.md',
            entityId: taskId ?? undefined,
          },
        ),
      )
    }

    const instructionCount = countTaskInstructions(section)
    if (instructionCount === 0) {
      issues.push(
        issue('val-task-no-instructions', `Task ${taskId} has zero instructions`, {
          severity: 'block',
          blocksPreview: true,
          blocksCommit: true,
          file: 'tasks.md',
          entityId: taskId ?? undefined,
        }),
      )
    }

    const doneWhen = section.match(/- \*\*Done when:\*\* (.+)/i)?.[1]?.trim() ?? ''
    if (/^(when it works|when complete)$/i.test(doneWhen) || doneWhen.length < 12) {
      issues.push(
        issue('val-vague-done-when', `Task ${taskId} has vague done-when`, {
          severity: 'warn',
          blocksPreview: false,
          blocksCommit: true,
          file: 'tasks.md',
          entityId: taskId ?? undefined,
        }),
      )
    }

    if (featureId && doneWhen.includes('F-') && !doneWhen.includes(featureId)) {
      const cited = doneWhen.match(/F-\d{3}/)?.[0]
      if (cited && cited !== featureId) {
        issues.push(
          issue('val-done-when-feature-mismatch', `Task ${taskId} done-when cites ${cited} not ${featureId}`, {
            severity: 'block',
            blocksPreview: true,
            blocksCommit: true,
            file: 'tasks.md',
            entityId: taskId ?? undefined,
          }),
        )
      }
    }
  }

  for (const section of featureSections) {
    const featureId = parseFeatureIdFromSection(section)
    const criteriaCount = countAcceptanceCriteria(section)

    if (criteriaCount === 0) {
      issues.push(
        issue('val-feature-no-criteria', `Feature ${featureId} has zero acceptance criteria`, {
          severity: 'block',
          blocksPreview: false,
          blocksCommit: true,
          file: 'features.md',
          entityId: featureId ?? undefined,
        }),
      )
    }

    for (const criterion of parseCriteriaLines(section)) {
      if (isLikelyWeakCriterion(criterion)) {
        issues.push(
          issue('val-weak-criterion', `Feature ${featureId} weak criterion: "${criterion}"`, {
            severity: 'warn',
            blocksPreview: false,
            blocksCommit: false,
            file: 'features.md',
            entityId: featureId ?? undefined,
          }),
        )
      }
    }
  }

  if (input.routerPlan) {
    for (const op of input.routerPlan.operations) {
      if (op.action !== 'update' || !op.entity_id) continue

      if (op.target === 'features.md' && !featureIdSet.has(op.entity_id)) {
        issues.push(
          issue(
            'val-unknown-entity-update',
            `Update targets missing feature ${op.entity_id}`,
            {
              severity: 'block',
              blocksPreview: true,
              blocksCommit: true,
              file: 'features.md',
              entityId: op.entity_id,
            },
          ),
        )
      }

      if (op.target === 'tasks.md' && !taskIds.includes(op.entity_id)) {
        issues.push(
          issue('val-unknown-entity-update', `Update targets missing task ${op.entity_id}`, {
            severity: 'block',
            blocksPreview: true,
            blocksCommit: true,
            file: 'tasks.md',
            entityId: op.entity_id,
          }),
        )
      }
    }

    const hasFeatureAdd = input.routerPlan.operations.some(
      (op) => op.target === 'features.md' && op.action === 'add',
    )
    const hasTaskAdd = input.routerPlan.operations.some(
      (op) => op.target === 'tasks.md' && op.action === 'add',
    )

    if (hasFeatureAdd && !hasTaskAdd) {
      issues.push(
        issue('val-feature-no-task', 'add_feature without paired tasks.md add', {
          severity: 'warn',
          blocksPreview: false,
          blocksCommit: true,
          file: 'tasks.md',
        }),
      )
    }
  }

  const warnings = issues.filter((row) => row.severity === 'warn')
  const blocks = issues.filter((row) => row.severity === 'block')

  const blocksPreview = blocks.some((row) => row.blocksPreview)
  const blocksCommit = [...blocks, ...warnings].some((row) => row.blocksCommit)

  const modeBlocks =
    input.mode === 'preview'
      ? blocksPreview
      : blocks.some((row) => row.blocksCommit) || warnings.some((row) => row.blocksCommit)

  if (modeBlocks) {
    return {
      ok: false,
      issues: blocks,
      warnings,
      blocksPreview,
      blocksCommit,
    }
  }

  return {
    ok: true,
    issues: blocks,
    warnings,
    blocksPreview: false,
    blocksCommit,
  }
}
