/**
 * tasks.md writer rules — Phase 4 · Job 1.
 * **[USER]** approved 2026-06-06 before task writer LLM ships.
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

export interface TaskInstructionExample {
  id: string
  label: string
  bad: string[]
  good: string[]
}

export interface TaskWriterRules {
  headingPattern: string
  requiredFields: string[]
  statusValues: TaskStatus[]
  minimumInstructionCount: number
  markdownTemplate: string
  addRules: string[]
  updateRules: string[]
  instructionRules: string[]
  doneWhenRules: string[]
  instructionExamples: TaskInstructionExample[]
  writerBehavior: string[]
  example: TaskSectionFields
  updateMarkDoneExample: {
    before: TaskSectionFields
    after: TaskSectionFields
  }
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

  minimumInstructionCount: 1,

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
    'Default one task per new feature on add_feature; split into multiple T-xxx only when user explicitly asks.',
    'Default status todo unless user marks in progress or done in the message.',
    'At least two numbered instructions for non-trivial features; one allowed for trivial scope.',
    'Done when must reference the linked feature acceptance criteria or restate them briefly.',
    'Instructions should map to feature acceptance criteria — one step per criterion when scope is clear.',
  ],

  updateRules: [
    'Router update_task with entity_id T-xxx → patch only that section; preserve ID.',
    'Mark done when user says "mark T-xxx done" — set status done; do not delete the task section.',
    'Mark in progress when user says they started work — set status in_progress.',
    'Append instructions when user adds scope; replace only when user explicitly replaces steps.',
    'Never orphan a task from its feature link unless user removes the feature.',
  ],

  instructionRules: [
    'Numbered steps — ordered sequence an agent can execute without guessing order.',
    'Intent + outcome level — "Configure OAuth for Google sign-in", not "edit auth.ts line 42".',
    'Each step should be verifiable or map to one acceptance criterion where possible.',
    'No empty steps; no placeholder "TBD" in v0 writer output.',
    'Prefer verbs that describe deliverable outcomes: Configure, Add, Restrict, Implement, Wire.',
  ],

  doneWhenRules: [
    'Prefer: "All acceptance criteria for F-xxx pass" when task implements a full feature.',
    'For partial tasks: name the specific criteria or observable outcome (e.g. "User can pan the canvas").',
    'Must not be vague ("when it works", "when complete").',
  ],

  instructionExamples: [
    {
      id: 'tw-ex-google-login',
      label: 'Google login (from flow-b-v0)',
      bad: [
        'Install OAuth library',
        'Edit auth.ts',
        'Add Google button to LoginForm.tsx',
      ],
      good: [
        'Add OAuth provider configuration for Google Workspace sign-in',
        'Restrict authentication to allowed enterprise domains configured in product settings',
        'Add admin UI flow to revoke a user\'s access',
      ],
    },
    {
      id: 'tw-ex-canvas-pan',
      label: 'Canvas pan/zoom (F-001)',
      bad: ['Implement pan', 'Use React Flow minZoom', 'Make canvas work'],
      good: [
        'Wire drag-to-pan on the canvas viewport',
        'Wire scroll/pinch zoom within configured min and max levels',
        'Persist pan and zoom when switching between overview and detail layers',
      ],
    },
    {
      id: 'tw-ex-mark-done',
      label: 'Mark task done (update_task)',
      bad: ['Delete T-001 section', 'Remove task from tasks.md'],
      good: ['Set status to done; keep instructions and feature link unchanged'],
    },
  ],

  writerBehavior: [
    'On add (paired with add_feature): derive instructions from feature acceptance criteria when both files targeted in same router turn.',
    'On add (standalone add_task): link to existing F-xxx from user message or context; fail clarify if feature unclear.',
    'On update_task: patch status and/or instructions only — never renumber or reassign T-xxx ID.',
    'If user message is too vague for concrete steps → router should have been clarify, not add_task.',
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

  updateMarkDoneExample: {
    before: {
      id: 'T-001',
      title: 'Build React Flow canvas',
      featureId: 'F-001',
      status: 'in_progress',
      instructions: [
        'Implement layered canvas with Product center and Frontend/Backend pillars',
        'Wire overview and detail layers with zoom-based drill-down',
      ],
      doneWhen: 'All acceptance criteria for F-001 pass',
    },
    after: {
      id: 'T-001',
      title: 'Build React Flow canvas',
      featureId: 'F-001',
      status: 'done',
      instructions: [
        'Implement layered canvas with Product center and Frontend/Backend pillars',
        'Wire overview and detail layers with zoom-based drill-down',
      ],
      doneWhen: 'All acceptance criteria for F-001 pass',
    },
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
  const exampleBlock = rules.instructionExamples
    .map((ex) => {
      const bad = ex.bad.map((line) => `  - ✗ ${line}`).join('\n')
      const good = ex.good.map((line) => `  - ✓ ${line}`).join('\n')
      return [`### ${ex.label}`, 'Bad:', bad, 'Good:', good].join('\n')
    })
    .join('\n\n')

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
    `## Minimum instructions: ${rules.minimumInstructionCount} per task (2+ for non-trivial add)`,
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
    '## Instruction examples',
    exampleBlock,
    '',
    '## Writer behavior',
    ...rules.writerBehavior.map((line) => `- ${line}`),
    '',
    '## Example (T-002 → F-002)',
    formatTaskSection(rules.example),
    '',
    '## Update example — mark T-001 done (gp-09)',
    'Before:',
    formatTaskSection(rules.updateMarkDoneExample.before),
    '',
    'After:',
    formatTaskSection(rules.updateMarkDoneExample.after),
  ].join('\n')
}
