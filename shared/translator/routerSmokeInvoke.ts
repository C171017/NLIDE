/**
 * Manual router smoke invoke brief — Phase 2 · Job 4.
 * **[USER]** approved 2026-06-06 before `action:"route"` ships.
 *
 * Copy-paste commands for InsForge CLI. `route` is not live until Agent mode
 * implements routeIntent() in nlide-api.
 */

export interface RouterSmokeExample {
  id: string
  label: string
  /** Golden prompt id when this mirrors a fixture case */
  goldenPromptId?: string
  message: string
  expectedIntentType: string
  notes?: string
}

export interface RouterSmokeInvokeBrief {
  action: string
  prerequisite: string[]
  successShape: string
  failureCodes: string[]
  examples: RouterSmokeExample[]
  goldenBatchNote: string
}

/** Minimal canvas context for router-only smoke (no DB required). */
export const SMOKE_CONTEXT = {
  projectName: 'NLIDE Demo',
  centerCardId: 'product',
  cards: [
    {
      id: 'F-001',
      type: 'feature',
      title: 'Canvas interaction',
      body: 'Pan, zoom, and navigate the intent canvas.',
      specRef: { file: 'features.md', anchor: 'F-001' },
      status: 'approved',
    },
    {
      id: 'T-001',
      type: 'task',
      title: 'Implement pan controls',
      body: 'Wire React Flow pan/zoom.',
      specRef: { file: 'tasks.md', anchor: 'T-001' },
      status: 'in_progress',
    },
  ],
  edges: [{ source: 'product', target: 'F-001' }],
} as const

export const ROUTER_SMOKE_EXAMPLES: RouterSmokeExample[] = [
  {
    id: 'smoke-update-feature',
    label: 'Golden #1 — pan/zoom → update_feature',
    goldenPromptId: 'gp-01-canvas-pan-zoom',
    message: 'Users should be able to pan and zoom the canvas.',
    expectedIntentType: 'update_feature',
  },
  {
    id: 'smoke-noop',
    label: 'Golden #7 — InsForge setup → noop',
    goldenPromptId: 'gp-07-noop-infra',
    message: 'Set up InsForge for the backend.',
    expectedIntentType: 'noop',
    notes: 'Must return empty operations[] — not add_feature or clarify.',
  },
  {
    id: 'smoke-clarify',
    label: 'Golden #6 — SSO domains → clarify',
    goldenPromptId: 'gp-06-clarify-domains',
    message: 'Which Google Workspace domains should be allowed for SSO?',
    expectedIntentType: 'clarify',
    notes: 'open_questions[] must be non-empty; only open-questions.md target.',
  },
]

export const ROUTER_SMOKE_INVOKE_BRIEF: RouterSmokeInvokeBrief = {
  action: 'route',
  prerequisite: [
    'npm run insforge:link — project linked',
    'npm run insforge:deploy:api — nlide-api deployed with routeIntent()',
    'Model Gateway / Claude secret configured for router LLM calls',
  ],
  successShape:
    '{ "ok": true, "plan": { "intent_type", "summary", "operations", "canvas_ops", "open_questions" } }',
  failureCodes: ['router_invalid_json (502)', 'router_validation_failed (422)'],
  examples: ROUTER_SMOKE_EXAMPLES,
  goldenBatchNote:
    'Run all 10 golden prompts via action:"route" and score with goldenRouterMatch; need ≥8/10 pass before replacing stub.',
}

/** Build JSON body for `insforge functions invoke nlide-api --data '...'` */
export function buildRouteInvokePayload(message: string, context = SMOKE_CONTEXT): string {
  return JSON.stringify({
    action: 'route',
    message,
    context,
  })
}

/** Format brief + example commands for docs or Agent mode. */
export function formatRouterSmokeInvokeBrief(
  brief: RouterSmokeInvokeBrief = ROUTER_SMOKE_INVOKE_BRIEF,
): string {
  const lines = [
    '## Prerequisites',
    ...brief.prerequisite.map((line) => `- ${line}`),
    '',
    '## Success response',
    brief.successShape,
    '',
    '## Failure codes',
    ...brief.failureCodes.map((line) => `- ${line}`),
    '',
    '## Example invokes',
  ]

  for (const ex of brief.examples) {
    lines.push(
      '',
      `### ${ex.label}`,
      ex.notes ? `_${ex.notes}_` : '',
      '```bash',
      `insforge functions invoke nlide-api --data '${buildRouteInvokePayload(ex.message)}'`,
      '```',
      `Expected intent_type: \`${ex.expectedIntentType}\``,
    )
  }

  lines.push('', '## Golden batch', brief.goldenBatchNote)
  return lines.filter(Boolean).join('\n')
}
