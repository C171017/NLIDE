/**
 * Validator strictness brief — Phase 4 · Job 2.
 * **[AI-INFERRED]** draft for [USER] review before spec validator ships.
 *
 * Defines block vs warn rules after writers patch spec files — duplicates, orphans,
 * contradictions, and content quality gates.
 */

export type ValidatorSeverity = 'block' | 'warn'

export interface ValidatorRule {
  id: string
  label: string
  severity: ValidatorSeverity
  /** block = no preview; warn = preview allowed, commit may still block */
  blocksPreview: boolean
  blocksCommit: boolean
  description: string
}

export interface ValidatorStrictness {
  policy: string
  runWhen: string[]
  idRules: ValidatorRule[]
  linkRules: ValidatorRule[]
  duplicateRules: ValidatorRule[]
  contradictionRules: ValidatorRule[]
  contentRules: ValidatorRule[]
  previewBehavior: string[]
  commitBehavior: string[]
  apiErrorShape: string[]
  explicitNonGoals: string[]
}

export const VALIDATOR_STRICTNESS: ValidatorStrictness = {
  policy:
    'After writers finish, validate the patched spec before showing preview. Structural errors ' +
    '(broken IDs, orphan links, missing required fields) block preview. Quality issues warn on ' +
    'preview but block commit until fixed or user explicitly overrides in a later v0 iteration.',

  runWhen: [
    'After all writer calls for the current router turn complete (features, tasks, product, etc.).',
    'Before buildPreview() assembles ghost cards and mdPatches summary.',
    'Re-run on commit against the full merged spec (not just the delta) when hybrid storage ships.',
  ],

  idRules: [
    {
      id: 'val-dup-feature-id',
      label: 'Duplicate F-xxx in features.md',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'Two sections share the same feature ID — writer or merge bug.',
    },
    {
      id: 'val-dup-task-id',
      label: 'Duplicate T-xxx in tasks.md',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'Two sections share the same task ID.',
    },
    {
      id: 'val-id-gap',
      label: 'Skipped ID in sequence (F-003 exists but no F-002)',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: false,
      description: 'Gaps are allowed after deletes; flag for human awareness only in v0.',
    },
    {
      id: 'val-unknown-entity-update',
      label: 'Update targets entity_id not found in file',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'Router update_feature/update_task references missing F-xxx or T-xxx.',
    },
  ],

  linkRules: [
    {
      id: 'val-orphan-task-feature',
      label: 'Task links missing F-xxx',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'tasks.md **Feature:** references an F-xxx that does not exist in features.md.',
    },
    {
      id: 'val-feature-no-task',
      label: 'New feature with no paired task',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: true,
      description:
        'add_feature co-targeted tasks.md but no T-xxx was written, or feature has no related task.',
    },
    {
      id: 'val-task-no-instructions',
      label: 'Task has zero instructions',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'Every task must have at least one numbered instruction per taskWriterRules.',
    },
    {
      id: 'val-broken-related-ref',
      label: 'Related field cites missing ID',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: false,
      description: 'features.md **Related:** mentions T-xxx or F-xxx that is not present — soft link check.',
    },
  ],

  duplicateRules: [
    {
      id: 'val-dup-feature-title',
      label: 'Two features with same title',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: false,
      description: 'Likely accidental duplicate scope; human should merge or rename.',
    },
    {
      id: 'val-dup-task-instructions',
      label: 'Two tasks for same F-xxx with identical instruction sets',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: false,
      description: 'Possible writer duplication when user asked for one task.',
    },
  ],

  contradictionRules: [
    {
      id: 'val-done-when-feature-mismatch',
      label: 'Done when references wrong F-xxx',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'Task **Feature:** F-001 but **Done when:** cites F-002.',
    },
    {
      id: 'val-feature-done-tasks-open',
      label: 'Feature status done but linked tasks not done',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: false,
      description: 'Status inconsistency — feature marked done while T-xxx still todo/in_progress.',
    },
    {
      id: 'val-constraint-non-goal-conflict',
      label: 'New feature conflicts with constraints non-goal',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: true,
      description:
        'Keyword/heuristic match only in v0 (e.g. constraint "No SMS auth" + feature "SMS login").',
    },
    {
      id: 'val-decision-contradicts-feature',
      label: 'Active feature contradicts locked decision',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: true,
      description: 'Feature description opposes a decision in decisions.md — flag for human review.',
    },
  ],

  contentRules: [
    {
      id: 'val-feature-no-criteria',
      label: 'Feature has zero acceptance criteria',
      severity: 'block',
      blocksPreview: false,
      blocksCommit: true,
      description: 'From acceptanceCriteriaBar — warn on preview, block commit.',
    },
    {
      id: 'val-weak-criterion',
      label: 'Acceptance criterion matches forbidden pattern',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: false,
      description: 'Uses isLikelyWeakCriterion() — file paths, "make it work", etc.',
    },
    {
      id: 'val-vague-done-when',
      label: 'Task done-when is vague',
      severity: 'warn',
      blocksPreview: false,
      blocksCommit: true,
      description: 'Matches "when it works", "when complete", or under 12 chars.',
    },
    {
      id: 'val-empty-instruction-step',
      label: 'Task has empty or TBD instruction step',
      severity: 'block',
      blocksPreview: true,
      blocksCommit: true,
      description: 'From taskWriterRules — no placeholder steps in v0 output.',
    },
  ],

  previewBehavior: [
    'Any block-severity rule with blocksPreview:true → return validation_failed; no ghost cards.',
    'Warn-only issues → show preview with amber banner listing warnings; user can review MD.',
    'Block-on-commit-only issues → preview renders; Commit button disabled until resolved.',
    'Inline list: rule id, severity, file, entity_id, short message.',
  ],

  commitBehavior: [
    'Re-validate full spec snapshot before writing to Postgres and /spec export.',
    'Any rule with blocksCommit:true → reject commit with same error shape as preview.',
    'Warn-only on commit → allow commit but persist warnings on preview row for audit (v0 optional).',
    'Never auto-fix or silently drop invalid sections.',
  ],

  apiErrorShape: [
    'Success with warnings: { ok: true, preview: {...}, warnings: ValidatorIssue[] }.',
    'Failure: { ok: false, error: { code: "validation_failed", issues: ValidatorIssue[] } }.',
    'ValidatorIssue: { ruleId, severity, file, entityId?, message }.',
    'action:intent propagates validation failure — no stub fallback (same policy as router).',
  ],

  explicitNonGoals: [
    'No LLM-based contradiction detection in v0 — keyword/heuristic only.',
    'No auto-merge of duplicate features or tasks.',
    'No validator bypass for "just commit anyway" in v0 UI.',
    'No validation of canvas_ops placement (Phase 5 mapper scope).',
  ],
}

/** Flatten brief for Agent mode or writer system prompt assembly. */
export function formatValidatorStrictness(
  brief: ValidatorStrictness = VALIDATOR_STRICTNESS,
): string {
  const formatRules = (title: string, rules: ValidatorRule[]) => {
    const lines = rules.map(
      (r) =>
        `- **${r.id}** (${r.severity}) — ${r.label}: ${r.description}` +
        ` [preview:${r.blocksPreview ? 'block' : 'ok'}, commit:${r.blocksCommit ? 'block' : 'ok'}]`,
    )
    return [`## ${title}`, ...lines].join('\n')
  }

  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((line) => `- ${line}`)].join('\n')

  return [
    '## Policy',
    brief.policy,
    '',
    section('Run when', brief.runWhen),
    '',
    formatRules('ID rules', brief.idRules),
    '',
    formatRules('Link / orphan rules', brief.linkRules),
    '',
    formatRules('Duplicate rules', brief.duplicateRules),
    '',
    formatRules('Contradiction rules', brief.contradictionRules),
    '',
    formatRules('Content quality rules', brief.contentRules),
    '',
    section('Preview behavior', brief.previewBehavior),
    '',
    section('Commit behavior', brief.commitBehavior),
    '',
    section('API error shape', brief.apiErrorShape),
    '',
    section('Explicit non-goals', brief.explicitNonGoals),
  ].join('\n')
}

/** Rules that block showing preview at all. */
export function getPreviewBlockingRuleIds(
  brief: ValidatorStrictness = VALIDATOR_STRICTNESS,
): string[] {
  const all = [
    ...brief.idRules,
    ...brief.linkRules,
    ...brief.duplicateRules,
    ...brief.contradictionRules,
    ...brief.contentRules,
  ]
  return all.filter((r) => r.blocksPreview).map((r) => r.id)
}

/** Rules that block commit even when preview was shown. */
export function getCommitBlockingRuleIds(
  brief: ValidatorStrictness = VALIDATOR_STRICTNESS,
): string[] {
  const all = [
    ...brief.idRules,
    ...brief.linkRules,
    ...brief.duplicateRules,
    ...brief.contradictionRules,
    ...brief.contentRules,
  ]
  return all.filter((r) => r.blocksCommit).map((r) => r.id)
}
