import type {
  GoldenMatchResult,
  GoldenPrompt,
  GoldenPromptExpectation,
  RouterPlan,
} from './types.ts'

function targetsInPlan(plan: RouterPlan): string[] {
  return plan.operations.map((op) => op.target)
}

function entityIdsInPlan(plan: RouterPlan): string[] {
  return plan.operations.flatMap((op) => (op.entity_id ? [op.entity_id] : []))
}

/** Score one router output against Phase 1 expectation rules (summary may differ). */
export function evaluateGoldenRouterOutput(
  actual: RouterPlan,
  golden: GoldenPrompt,
): GoldenMatchResult {
  return evaluateAgainstExpectation(actual, golden.id, golden.expectation)
}

export function evaluateAgainstExpectation(
  actual: RouterPlan,
  promptId: string,
  expectation: GoldenPromptExpectation,
): GoldenMatchResult {
  const failures: string[] = []

  if (actual.intent_type !== expectation.intentType) {
    failures.push(
      `intent_type: expected ${expectation.intentType}, got ${actual.intent_type}`,
    )
  }

  const actualTargets = targetsInPlan(actual)
  for (const target of expectation.operationTargets) {
    if (!actualTargets.includes(target)) {
      failures.push(`missing operation target: ${target}`)
    }
  }

  if (expectation.entityIds?.length) {
    const actualIds = entityIdsInPlan(actual)
    for (const entityId of expectation.entityIds) {
      if (!actualIds.includes(entityId)) {
        failures.push(`missing entity_id in operations: ${entityId}`)
      }
    }
  }

  const openEmpty = expectation.openQuestionsEmpty !== false
  if (openEmpty && actual.open_questions.length > 0) {
    failures.push(`open_questions must be empty, got ${actual.open_questions.length}`)
  }
  if (!openEmpty && actual.open_questions.length === 0) {
    failures.push('open_questions must be non-empty for clarify')
  }

  if (expectation.mustNot?.intentTypes?.includes(actual.intent_type)) {
    failures.push(`must not use intent_type: ${actual.intent_type}`)
  }

  for (const forbidden of expectation.mustNot?.operationTargets ?? []) {
    if (actualTargets.includes(forbidden)) {
      failures.push(`must not target: ${forbidden}`)
    }
  }

  if (actual.intent_type === 'noop') {
    if (actual.operations.length > 0) {
      failures.push('noop must have empty operations[]')
    }
  }

  if (actual.intent_type === 'clarify') {
    const nonOpen = actualTargets.filter((t) => t !== 'open-questions.md')
    if (nonOpen.length > 0) {
      failures.push(`clarify must only target open-questions.md, also saw: ${nonOpen.join(', ')}`)
    }
  }

  return {
    pass: failures.length === 0,
    promptId,
    failures,
  }
}

export function scoreGoldenRouterResults(
  results: GoldenMatchResult[],
): { passCount: number; total: number; results: GoldenMatchResult[] } {
  const passCount = results.filter((row) => row.pass).length
  return { passCount, total: results.length, results }
}
