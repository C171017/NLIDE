import type { RouterIntentType, RouterIntentTypeDef } from './types.ts'

/** **[USER]** approved v0 — NLIDE chat router intent taxonomy. */
export const ROUTER_INTENT_TYPES: RouterIntentTypeDef[] = [
  {
    intentType: 'add_feature',
    plainName: 'New thing to build',
    summary: 'Add row in features.md (+ usually add tasks.md)',
    specTargets: ['features.md', 'tasks.md'],
    example: 'Add Google login for enterprise users',
  },
  {
    intentType: 'update_feature',
    plainName: 'Change something we already defined',
    summary: 'Update existing feature ID (body, status, priority, acceptance)',
    specTargets: ['features.md'],
    example: 'Canvas should pan and zoom → update F-001',
  },
  {
    intentType: 'add_task',
    plainName: 'New agent work item',
    summary: 'Add tasks.md entry linked to a feature',
    specTargets: ['tasks.md'],
    example: 'Add task to implement pan controls',
  },
  {
    intentType: 'update_task',
    plainName: 'Change a task',
    summary: 'Update existing T-xxx',
    specTargets: ['tasks.md'],
    example: 'Mark T-001 done',
  },
  {
    intentType: 'update_product',
    plainName: 'Who / why we are building',
    summary: 'Patch product.md and/or users.md',
    specTargets: ['product.md', 'users.md'],
    example: 'Solo builders and small teams…',
  },
  {
    intentType: 'update_architecture',
    plainName: 'How the system fits together',
    summary: 'Patch architecture.md (intent-level, not file paths)',
    specTargets: ['architecture.md'],
    example: 'Layered canvas: product center, zoom between layers',
  },
  {
    intentType: 'add_constraint',
    plainName: 'Rule or limit',
    summary: 'Add or patch constraints.md',
    specTargets: ['constraints.md'],
    example: 'No mobile in v0; not real-time execution',
  },
  {
    intentType: 'add_decision',
    plainName: 'Choice we settled',
    summary: 'Add decisions.md entry',
    specTargets: ['decisions.md'],
    example: 'Start with Flow B; Claude Sonnet; hybrid storage',
  },
  {
    intentType: 'clarify',
    plainName: 'We do not know yet — ask me',
    summary: 'Add open_questions.md only; do not guess',
    specTargets: ['open-questions.md'],
    example: 'Which Google domains are allowed?',
  },
  {
    intentType: 'noop',
    plainName: 'Not spec content',
    summary: 'Empty operations — Cursor/build/explain requests',
    specTargets: [],
    example: 'Set up InsForge; explain schema; edit UI chrome',
  },
]

export const ROUTING_RULES: string[] = [
  'Canvas interaction (pan, zoom, drag, layers) → update_feature on F-001 (+ add_task if needed). Not clarify by default.',
  'New product capability → add_feature + add_task.',
  'Scope / non-goals / “we are not doing X” → add_constraint.',
  'Resolved “we picked X” → add_decision.',
  'Missing info or real ambiguity → clarify → open_questions.md only.',
  'Intent wording, not code — route “users can pan”, not “set React Flow minZoom”.',
  'Prefer update over add when an existing card/ID already covers the topic.',
  'Never create open question on every message.',
]

export const SPEC_FILE_ALLOWLIST: string[] = [
  'INDEX.md',
  'product.md',
  'users.md',
  'features.md',
  'architecture.md',
  'tasks.md',
  'constraints.md',
  'decisions.md',
  'open-questions.md',
]

/** **[USER]** locked v0 (2026-06-06) — router JSON top-level fields; LLM fills slots only. */
export const ROUTER_SCHEMA_FIELDS: string[] = [
  'intent_type',
  'summary',
  'operations[]',
  'canvas_ops[]',
  'open_questions[]',
]

export function isRouterIntentType(value: string): value is RouterIntentType {
  return ROUTER_INTENT_TYPES.some((row) => row.intentType === value)
}

export function isSpecFileAllowed(file: string): boolean {
  return SPEC_FILE_ALLOWLIST.includes(file)
}
