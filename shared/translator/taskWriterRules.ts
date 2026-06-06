/**
 * tasks.md writer rules — Phase 4 · Job 1.
 * **[AI-INFERRED]** draft for [USER] review before task writer LLM ships.
 *
 * Defines markdown shape and rules when router targets tasks.md.
 */

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked'

export interface TaskSectionFields {
  id: string
  title: string
  featureId: string
  status: TaskStatus
  instructions: string[]
  doneWhen: string
}

export interface TaskWriterRules {
  headingPattern: string
  requiredFields: string[]
  statusValues: TaskStatus[]
  markdownTemplate: string
  addRules: string[]
  updateRules: string[]
  instructionRules: string[]
  doneWhenRules: string[]
  example: TaskSectionFields
}

export const TASK_WRITER_RULES: TaskWriterRules = {
  headingPattern: '### {id}: {title}',

  requiredFields: [
    'id — stable T-xxx (assigned on add; preserved on update)',
    'title — short agent-facing name',
    'feature — linked F-xxx (required unless update_task marks standalone maintenance)',
    'status — todo | in_progress | done | blocked',
    'instructions for agent — numbered, concrete steps an external agent can follow',
    'done when — clear completion condition, usually references feature acceptance criteria',
  ],

  statusValues: ['todo', 'in_progress', 'done', 'blocked'],

  markdownTemplate: `### {id}: {title}

- **Feature:** {feature_id}
- **Status:** {status}
- **Instructions for agent:**
  1. {step_1}
  2. {step_2}
- **Done when:** {done_when}`,

  addRules: [
    'Router add on tasks.md → allocate next free T-xxx; link to feature from same router turn when add_feature co-targets tasks.md.',
    'When add_feature adds F-00x, paired task should reference that F-00x ID.',
    'Default status todo unless user marks in progress or done in the message.',
    'At least two numbered instructions for non-trivial features; one allowed for trivial updates.',
    'Done when must reference the linked feature acceptance criteria or restate them briefly.',
  ],

  updateRules: [
    'Router update_task with entity_id T-xxx → patch only that section; preserve ID.',
    'Mark done when user says "mark T-xxx done" — set status done; do not delete the task section.',
    'Append instructions when user adds scope; replace only when user explicitly replaces steps.',
    'Never orphan a task from its feature link unless user removes the feature.',
  ],

  instructionRules: [
    'Numbered steps — ordered sequence an agent can execute without guessing order.',
    'Intent + outcome level — "Configure OAuth for Google sign-in", not "edit auth.ts line 42".',
    'Each step should be verifiable or map to one acceptance criterion where possible.',
    'No empty steps; no placeholder "TBD" in v0 writer output.',
  ],

  doneWhenRules: [
    'Prefer: "All acceptance criteria for F-xxx pass" when task implements a full feature.',
    'For partial tasks: name the specific criteria or observable outcome (e.g. "User can pan the canvas").',
    'Must not be vague ("when it works", "when complete").',
  ],

  example: {
    id: 'T-002',
    title: 'Implement Google OAuth login',
    featureId: 'F-002',
    status: 'todo',
    instructions: [
      'Add OAuth provider configuration for Google Workspace sign-in',
      'Restrict authentication to allowed enterprise domains configured in product settings',
      'Add admin UI flow to revoke a user\'s access',
    ],
    doneWhen: 'All acceptance criteria for F-002 pass',
  },
}

/** Render task section as canonical markdown. */
export function formatTaskSection(fields: TaskSectionFields): string {
  const steps = fields.instructions.map((step, i) => `  ${i + 1}. ${step}`).join('\n')
  return [
    `### ${fields.id}: ${fields.title}`,
    '',
    `- **Feature:** ${fields.featureId}`,
    `- **Status:** ${fields.status}`,
    '- **Instructions for agent:',
    steps,
    `- **Done when:** ${fields.doneWhen}`,
  ].join('\n')
}

/** Flatten rules for writer system prompt assembly. */
export function formatTaskWriterRules(rules: TaskWriterRules = TASK_WRITER_RULES): string {
  return [
    '## Heading',
    rules.headingPattern,
    '',
    '## Required fields',
    ...rules.requiredFields.map((line) => `- ${line}`),
    '',
    '## Status values',
    rules.statusValues.join(' | '),
    '',
    '## Markdown template',
    rules.markdownTemplate,
    '',
    '## Add rules',
    ...rules.addRules.map((line) => `- ${line}`),
    '',
    '## Update rules',
    ...rules.updateRules.map((line) => `- ${line}`),
    '',
    '## Instruction rules',
    ...rules.instructionRules.map((line) => `- ${line}`),
    '',
    '## Done when rules',
    ...rules.doneWhenRules.map((line) => `- ${line}`),
    '',
    '## Example (T-002 → F-002)',
    formatTaskSection(rules.example),
  ].join('\n')
}
