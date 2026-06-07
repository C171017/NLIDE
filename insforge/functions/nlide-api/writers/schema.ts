import { ACCEPTANCE_CRITERIA_BAR } from '../_shared/translator/acceptanceCriteriaBar.ts'
import { TASK_WRITER_RULES } from '../_shared/translator/taskWriterRules.ts'
import {
  allocateNextFeatureId,
  allocateNextTaskId,
  allocateNextDecisionId,
  allocateNextOpenQuestionId,
} from './idAlloc.ts'

export {
  allocateNextFeatureId,
  allocateNextTaskId,
  allocateNextDecisionId,
  allocateNextOpenQuestionId,
}

export interface FeatureSectionValidation {
  ok: true
  entityId: string
}

export interface FeatureSectionValidationFailure {
  ok: false
  code: 'writer_invalid_output' | 'writer_validation_failed'
  message: string
  issues: string[]
}

export type FeatureSectionParseResult = FeatureSectionValidation | FeatureSectionValidationFailure

const HEADING_RE = /^### (F-\d{3}): .+/m
const CRITERIA_BLOCK_RE = /- \*\*Acceptance criteria:\*\*\s*\n((?:  - .+\n?)+)/i

/** Strip optional markdown fences from LLM output. */
export function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i)
  return fenced ? fenced[1].trim() : trimmed
}

export function parseFeatureIdFromSection(section: string): string | null {
  const match = section.match(/^### (F-\d{3}):/m)
  return match?.[1] ?? null
}

export function countAcceptanceCriteria(section: string): number {
  const block = section.match(CRITERIA_BLOCK_RE)
  if (block) {
    return (block[1].match(/^\s*- /gm) ?? []).length
  }

  // Card bodies synced from TipTap often flatten bullets onto one line:
  // "- **Acceptance criteria:** - Criterion one - Criterion two"
  const inline = section.match(/- \*\*Acceptance criteria:\*\*\s*(.+)/i)
  if (!inline?.[1]?.trim()) return 0

  return inline[1]
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0).length
}

export function validateFeatureSection(
  section: string,
  options: {
    action: 'add' | 'update'
    expectedEntityId?: string
    allocatedEntityId?: string
  },
): FeatureSectionParseResult {
  const issues: string[] = []
  const normalized = stripMarkdownFences(section)

  if (!HEADING_RE.test(normalized)) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: 'Writer output must start with ### F-xxx: heading',
      issues: ['missing or invalid ### F-xxx: heading'],
    }
  }

  const entityId = parseFeatureIdFromSection(normalized)
  if (!entityId) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: 'Could not parse feature ID from section heading',
      issues: ['missing F-xxx id in heading'],
    }
  }

  if (!/Acceptance criteria:/i.test(normalized)) {
    issues.push('missing Acceptance criteria block')
  }

  const criteriaCount = countAcceptanceCriteria(normalized)
  if (criteriaCount < ACCEPTANCE_CRITERIA_BAR.minimumCount) {
    issues.push(
      `need at least ${ACCEPTANCE_CRITERIA_BAR.minimumCount} acceptance criterion (found ${criteriaCount})`,
    )
  }

  if (options.action === 'update' && options.expectedEntityId && entityId !== options.expectedEntityId) {
    issues.push(`entity_id must stay ${options.expectedEntityId}, got ${entityId}`)
  }

  if (options.action === 'add' && options.allocatedEntityId && entityId !== options.allocatedEntityId) {
    issues.push(`new feature must use ${options.allocatedEntityId}, got ${entityId}`)
  }

  if (issues.length > 0) {
    return {
      ok: false,
      code: 'writer_validation_failed',
      message: 'Feature section failed validation',
      issues,
    }
  }

  return { ok: true, entityId }
}

const TASK_HEADING_RE = /^### (T-\d{3}): .+/m
const TASK_FEATURE_RE = /- \*\*Feature:\*\* (F-\d{3})/i
const TASK_INSTRUCTIONS_RE = /- \*\*Instructions for agent:\*\*\s*\n((?:  \d+\. .+\n?)+)/i
const TASK_DONE_WHEN_RE = /- \*\*Done when:\*\* (.+)/i

export interface TaskSectionValidation {
  ok: true
  entityId: string
  featureId: string
}

export interface TaskSectionValidationFailure {
  ok: false
  code: 'writer_invalid_output' | 'writer_validation_failed'
  message: string
  issues: string[]
}

export type TaskSectionParseResult = TaskSectionValidation | TaskSectionValidationFailure

export function parseTaskIdFromSection(section: string): string | null {
  const match = section.match(/^### (T-\d{3}):/m)
  return match?.[1] ?? null
}

export function parseTaskFeatureId(section: string): string | null {
  const match = section.match(TASK_FEATURE_RE)
  return match?.[1] ?? null
}

export function countTaskInstructions(section: string): number {
  const block = section.match(TASK_INSTRUCTIONS_RE)
  if (!block) return 0
  return (block[1].match(/^\s*\d+\. /gm) ?? []).length
}

export function validateTaskSection(
  section: string,
  options: {
    action: 'add' | 'update'
    expectedEntityId?: string
    allocatedEntityId?: string
    linkedFeatureId?: string
  },
): TaskSectionParseResult {
  const issues: string[] = []
  const normalized = stripMarkdownFences(section)

  if (!TASK_HEADING_RE.test(normalized)) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: 'Writer output must start with ### T-xxx: heading',
      issues: ['missing or invalid ### T-xxx: heading'],
    }
  }

  const entityId = parseTaskIdFromSection(normalized)
  if (!entityId) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: 'Could not parse task ID from section heading',
      issues: ['missing T-xxx id in heading'],
    }
  }

  const featureId = parseTaskFeatureId(normalized)
  if (!featureId) {
    issues.push('missing **Feature:** F-xxx link')
  } else if (options.linkedFeatureId && featureId !== options.linkedFeatureId) {
    issues.push(`task must link ${options.linkedFeatureId}, got ${featureId}`)
  }

  const instructionCount = countTaskInstructions(normalized)
  if (instructionCount < TASK_WRITER_RULES.minimumInstructionCount) {
    issues.push(
      `need at least ${TASK_WRITER_RULES.minimumInstructionCount} instruction (found ${instructionCount})`,
    )
  }

  if (!TASK_DONE_WHEN_RE.test(normalized)) {
    issues.push('missing **Done when:** line')
  }

  if (options.action === 'update' && options.expectedEntityId && entityId !== options.expectedEntityId) {
    issues.push(`entity_id must stay ${options.expectedEntityId}, got ${entityId}`)
  }

  if (options.action === 'add' && options.allocatedEntityId && entityId !== options.allocatedEntityId) {
    issues.push(`new task must use ${options.allocatedEntityId}, got ${entityId}`)
  }

  if (issues.length > 0) {
    return {
      ok: false,
      code: 'writer_validation_failed',
      message: 'Task section failed validation',
      issues,
    }
  }

  return { ok: true, entityId, featureId: featureId! }
}

const ENTITY_HEADING_RES: Record<string, RegExp> = {
  'decisions.md': /^### (D-\d{3}): .+/m,
  'open-questions.md': /^### (OQ-\d{3}): .+/m,
}

export function validateEntitySection(
  section: string,
  targetFile: 'decisions.md' | 'open-questions.md',
  options: {
    action: 'add' | 'update'
    idPrefix: 'D' | 'OQ'
    expectedEntityId?: string
    allocatedEntityId?: string
  },
): FeatureSectionParseResult {
  const issues: string[] = []
  const normalized = stripMarkdownFences(section)
  const headingRe = ENTITY_HEADING_RES[targetFile]

  if (!headingRe?.test(normalized)) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: `Writer output must start with ### ${options.idPrefix}-xxx: heading`,
      issues: [`missing ### ${options.idPrefix}-xxx: heading`],
    }
  }

  const pattern = new RegExp(`^### (${options.idPrefix}-\\d{3}):`, 'm')
  const entityId = normalized.match(pattern)?.[1] ?? null
  if (!entityId) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: 'Could not parse entity ID from section heading',
      issues: ['missing entity id in heading'],
    }
  }

  if (options.action === 'update' && options.expectedEntityId && entityId !== options.expectedEntityId) {
    issues.push(`entity_id must stay ${options.expectedEntityId}, got ${entityId}`)
  }

  if (options.action === 'add' && options.allocatedEntityId && entityId !== options.allocatedEntityId) {
    issues.push(`new entry must use ${options.allocatedEntityId}, got ${entityId}`)
  }

  if (issues.length > 0) {
    return {
      ok: false,
      code: 'writer_validation_failed',
      message: 'Section failed validation',
      issues,
    }
  }

  return { ok: true, entityId }
}

const DOC_SECTION_CHECKS: Record<string, RegExp> = {
  'product.md': /## Vision/i,
  'users.md': /## Primary users/i,
  'architecture.md': /## Overview/i,
  'constraints.md': /## (Stack|Patterns|Non-goals)/i,
}

export function validateDocSection(
  section: string,
  targetFile: string,
): FeatureSectionParseResult {
  const normalized = stripMarkdownFences(section)
  const check = DOC_SECTION_CHECKS[targetFile]

  if (!check?.test(normalized)) {
    return {
      ok: false,
      code: 'writer_invalid_output',
      message: `${targetFile} output missing required section heading`,
      issues: [`expected content for ${targetFile}`],
    }
  }

  return { ok: true, entityId: targetFile }
}
