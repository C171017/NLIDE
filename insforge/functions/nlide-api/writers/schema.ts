import { ACCEPTANCE_CRITERIA_BAR } from '../_shared/translator/acceptanceCriteriaBar.ts'

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
  if (!block) return 0
  return (block[1].match(/^\s*- /gm) ?? []).length
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

/** Allocate next F-xxx ID from existing IDs. */
export function allocateNextFeatureId(existingIds: string[]): string {
  const nums = existingIds
    .map((id) => /^F-(\d{3})$/.exec(id))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => parseInt(match[1], 10))

  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `F-${String(max + 1).padStart(3, '0')}`
}
