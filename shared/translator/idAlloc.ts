/** Allocate next stable ID from existing IDs (F-001, T-002, D-003, OQ-004). */
export function allocateNextId(prefix: string, existingIds: string[]): string {
  const pattern = new RegExp(`^${prefix}-(\\d{3})$`)
  const nums = existingIds
    .map((id) => pattern.exec(id))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => parseInt(match[1], 10))

  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

export function allocateNextFeatureId(existingIds: string[]): string {
  return allocateNextId('F', existingIds)
}

export function allocateNextTaskId(existingIds: string[]): string {
  return allocateNextId('T', existingIds)
}

export function allocateNextDecisionId(existingIds: string[]): string {
  return allocateNextId('D', existingIds)
}

export function allocateNextOpenQuestionId(existingIds: string[]): string {
  return allocateNextId('OQ', existingIds)
}

export function allocateNextConstraintId(existingIds: string[]): string {
  return allocateNextId('C', existingIds)
}
