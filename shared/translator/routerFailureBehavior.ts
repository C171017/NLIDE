/**
 * Router failure behavior brief — Phase 2 · Job 3.
 * **[AI-INFERRED]** draft for [USER] review before routeIntent() implementation.
 *
 * When the LLM returns bad JSON or fails Zod validation: fail loud, never silently
 * fall back to the stub preview.
 */

export interface RouterFailureBehavior {
  policy: string
  invalidJson: string[]
  zodValidation: string[]
  apiErrorShape: string[]
  uiBehavior: string[]
  goldenTestBehavior: string[]
  explicitNonGoals: string[]
}

export const ROUTER_FAILURE_BEHAVIOR: RouterFailureBehavior = {
  policy:
    'Router failures are visible errors. Never auto-apply a stub preview or partial plan when ' +
    'classification fails. The user must see that routing failed and can retry or edit their message.',

  invalidJson: [
    'LLM response is not parseable JSON (markdown fences, prose, truncated output) → route fails.',
    'Return HTTP 502 with code router_invalid_json and a short message (no raw LLM dump in production).',
    'Log full LLM text server-side for debugging only.',
    'Do not retry silently in v0 — one attempt per chat submit.',
  ],

  zodValidation: [
    'Parsed JSON must pass Zod schema for RouterPlan (locked fields + allowlist + intent rules).',
    'Unknown top-level keys → fail.',
    'operations[].target not in SPEC_FILE_ALLOWLIST → fail.',
    'intent_type not in enum → fail.',
    'noop with non-empty operations[] → fail.',
    'clarify with operations targeting files other than open-questions.md → fail.',
    'Return HTTP 422 with code router_validation_failed and zodIssues[] (path + message).',
  ],

  apiErrorShape: [
    'Success: { ok: true, plan: RouterPlan } for action:"route".',
    'Failure: { ok: false, error: { code, message, zodIssues? } } — never return ok:true with a stub preview.',
    'action:"intent" (full preview pipeline) must propagate router failure — no buildPreview() fallback once router is live.',
  ],

  uiBehavior: [
    'Chat bar shows inline error banner with plain text (e.g. "Router could not classify this message").',
    'Do not render ghost preview cards on router failure.',
    'User can edit message and resubmit — no auto-commit.',
  ],

  goldenTestBehavior: [
    'Golden test runner: invalid JSON or Zod fail counts as a failed case (not skipped).',
    'Pass bar (≥8/10) applies only to cases that return valid, schema-compliant plans that match expectations.',
    'CI/local script exits non-zero if pass count < GOLDEN_PASS_BAR.minPass.',
  ],

  explicitNonGoals: [
    'No silent fallback to buildPreview() / translatorStub.',
    'No "best effort" partial operations[] on validation failure.',
    'No automatic open_questions.md on every failure (that was stub behavior — wrong).',
    'No client-side-only validation hiding server errors.',
  ],
}

/** Flatten brief for Agent mode or docs. */
export function formatRouterFailureBehavior(
  brief: RouterFailureBehavior = ROUTER_FAILURE_BEHAVIOR,
): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((line) => `- ${line}`)].join('\n')

  return [
    '## Policy',
    brief.policy,
    '',
    section('Invalid JSON', brief.invalidJson),
    '',
    section('Zod validation', brief.zodValidation),
    '',
    section('API error shape', brief.apiErrorShape),
    '',
    section('UI behavior', brief.uiBehavior),
    '',
    section('Golden tests', brief.goldenTestBehavior),
    '',
    section('Explicit non-goals', brief.explicitNonGoals),
  ].join('\n')
}
