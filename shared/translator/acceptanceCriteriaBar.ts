/**
 * Acceptance criteria quality bar — Phase 3 · Job 2.
 * **[AI-INFERRED]** draft for [USER] review before features writer LLM ships.
 *
 * Defines what "good enough" acceptance criteria look like before a feature
 * section is valid for preview/commit.
 */

export interface AcceptanceCriteriaExample {
  id: string
  label: string
  bad: string[]
  good: string[]
}

export interface AcceptanceCriteriaBar {
  policy: string
  minimumCount: number
  requiredQualities: string[]
  forbiddenPatterns: string[]
  goodPatterns: string[]
  examples: AcceptanceCriteriaExample[]
  validatorBehavior: string[]
  writerBehavior: string[]
}

export const ACCEPTANCE_CRITERIA_BAR: AcceptanceCriteriaBar = {
  policy:
    'Every feature in features.md must have acceptance criteria an external agent can verify ' +
    'without guessing. Vague or implementation-only criteria block preview commit validation.',

  minimumCount: 1,

  requiredQualities: [
    'Observable — describes what the user or system does/shows, not internal code structure',
    'Testable — a reviewer or agent could check pass/fail without inventing extra requirements',
    'Intent-level — user-facing outcome; optional to mention tech only when user stated it as constraint',
    'Specific enough — names the actor and outcome (e.g. "User can…", "Admin can…")',
  ],

  forbiddenPatterns: [
    'File paths or component names as the main criterion ("Add button to LoginForm.tsx")',
    'Single-word or empty criteria ("OAuth", "Make it work", "Handle errors")',
    'Pure implementation steps without outcome ("Install library X", "Create API route")',
    'Duplicate criteria that restate the description with no new testable detail',
  ],

  goodPatterns: [
    'User can {action} and see {result}',
    'Only {allowed group} can {action}',
    '{Role} can {action} from {place in product}',
    'System rejects {invalid case} with {visible feedback}',
  ],

  examples: [
    {
      id: 'ac-ex-google-login',
      label: 'Google login (from flow-b-v0)',
      bad: ['Use OAuth', 'Add Google sign-in button', 'Integrate with auth provider'],
      good: [
        'User can click "Sign in with Google" and complete OAuth authentication',
        'Only accounts from allowed enterprise domains can access the app',
        'Admin can revoke a user\'s access from the admin panel',
      ],
    },
    {
      id: 'ac-ex-canvas-pan',
      label: 'Canvas pan/zoom (F-001)',
      bad: ['Implement pan', 'Use React Flow minZoom', 'Canvas works'],
      good: [
        'User can drag to pan the canvas viewport',
        'User can zoom in and out within configured min/max levels',
        'Pan and zoom state persists when switching between overview and detail layers',
      ],
    },
    {
      id: 'ac-ex-vague',
      label: 'Vague user message',
      bad: ['Feature is nice', 'UI looks good'],
      good: [
        'User can complete the primary flow in under three clicks from the home canvas',
        'Empty state shows a short explanation and a link to add the first card',
      ],
    },
  ],

  validatorBehavior: [
    'Block commit (warn on preview) if any feature section has zero acceptance criteria.',
    'Warn (do not block v0) if a criterion matches forbiddenPatterns — flag for human edit.',
    'Warn if fewer than 2 criteria on add_feature when user message implies multiple outcomes.',
  ],

  writerBehavior: [
    'On add_feature: produce at least minimumCount criteria; prefer 2–4 when scope is non-trivial.',
    'On update_feature: append new criteria when user adds scope; do not remove existing unless asked.',
    'If user message is too vague to write testable criteria → router should have been clarify, not add_feature.',
    'Derive criteria from user message; do not invent enterprise/security details user did not imply.',
  ],
}

/** Flatten bar brief for writer system prompt or docs. */
export function formatAcceptanceCriteriaBar(
  bar: AcceptanceCriteriaBar = ACCEPTANCE_CRITERIA_BAR,
): string {
  const exampleBlock = bar.examples
    .map((ex) => {
      const bad = ex.bad.map((line) => `  - ✗ ${line}`).join('\n')
      const good = ex.good.map((line) => `  - ✓ ${line}`).join('\n')
      return [`### ${ex.label}`, 'Bad:', bad, 'Good:', good].join('\n')
    })
    .join('\n\n')

  return [
    '## Policy',
    bar.policy,
    '',
    `## Minimum count: ${bar.minimumCount} per feature`,
    '',
    '## Required qualities',
    ...bar.requiredQualities.map((line) => `- ${line}`),
    '',
    '## Forbidden patterns',
    ...bar.forbiddenPatterns.map((line) => `- ${line}`),
    '',
    '## Good patterns',
    ...bar.goodPatterns.map((line) => `- ${line}`),
    '',
    '## Examples',
    exampleBlock,
    '',
    '## Validator behavior',
    ...bar.validatorBehavior.map((line) => `- ${line}`),
    '',
    '## Writer behavior',
    ...bar.writerBehavior.map((line) => `- ${line}`),
  ].join('\n')
}

/** Quick check for a single criterion string (non-blocking helper for future validator). */
export function isLikelyWeakCriterion(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 12) return true
  const lower = trimmed.toLowerCase()
  if (/\.tsx|\.ts|\.jsx|npm |import |component\.|loginform|useoauth/i.test(trimmed)) return true
  if (/^(make it work|oauth|handle errors|implement|integrate|add button)/i.test(lower)) return true
  return false
}
