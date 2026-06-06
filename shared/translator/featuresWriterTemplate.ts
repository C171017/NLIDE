/**
 * Features.md writer section template — Phase 3 · Job 1.
 * **[AI-INFERRED]** draft for [USER] review before features writer LLM ships.
 *
 * Defines the markdown shape the writer LLM must produce for add/update on features.md.
 */

export type FeatureStatus = 'proposed' | 'approved' | 'in_progress' | 'done'
export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical'

export interface FeatureSectionFields {
  id: string
  title: string
  status: FeatureStatus
  priority: FeaturePriority
  description: string
  acceptanceCriteria: string[]
  related?: string[]
}

export interface FeaturesWriterTemplate {
  headingPattern: string
  requiredFields: string[]
  statusValues: FeatureStatus[]
  priorityValues: FeaturePriority[]
  markdownTemplate: string
  addRules: string[]
  updateRules: string[]
  example: FeatureSectionFields
}

export const FEATURES_WRITER_TEMPLATE: FeaturesWriterTemplate = {
  headingPattern: '### {id}: {title}',

  requiredFields: [
    'id — stable F-xxx (assigned on add; preserved on update)',
    'title — short human name',
    'status — proposed | approved | in_progress | done',
    'priority — low | medium | high | critical',
    'description — one or two sentences, intent wording (not code paths)',
    'acceptance criteria — bullet list, agent-testable outcomes',
    'related — optional links to other spec files or IDs',
  ],

  statusValues: ['proposed', 'approved', 'in_progress', 'done'],
  priorityValues: ['low', 'medium', 'high', 'critical'],

  markdownTemplate: `### {id}: {title}

- **Status:** {status}
- **Priority:** {priority}
- **Description:** {description}
- **Acceptance criteria:**
  - {criterion_1}
  - {criterion_2}
- **Related:** {related}`,

  addRules: [
    'Router action add → allocate next free F-xxx ID (never reuse or skip without validator check).',
    'New features default status proposed unless user explicitly approves in the message.',
    'Priority inferred from message urgency; default medium if unclear.',
    'Acceptance criteria required — writer must not leave the section without at least one criterion.',
    'Intent wording only — no React components, file paths, or npm packages as primary content.',
  ],

  updateRules: [
    'Router action update with entity_id → patch only that F-xxx section; preserve ID.',
    'Merge new acceptance criteria with existing unless user says replace.',
    'Status may advance (proposed → approved → in_progress → done) when user states it clearly.',
    'Do not delete a feature section on update unless user explicitly removes scope.',
  ],

  example: {
    id: 'F-001',
    title: 'Canvas interaction',
    status: 'approved',
    priority: 'high',
    description: 'Users can pan, zoom, and navigate the intent canvas.',
    acceptanceCriteria: [
      'User can drag to pan the canvas viewport',
      'User can scroll or pinch to zoom between configured min and max levels',
      'Canvas state persists pan/zoom when switching between overview and detail layers',
    ],
    related: ['architecture.md (canvas IA)', 'tasks.md T-001'],
  },
}

/** Render example section as canonical markdown for golden writer tests. */
export function formatFeatureSection(fields: FeatureSectionFields): string {
  const criteria = fields.acceptanceCriteria.map((c) => `  - ${c}`).join('\n')
  const related = fields.related?.length ? fields.related.join(', ') : '—'
  return [
    `### ${fields.id}: ${fields.title}`,
    '',
    `- **Status:** ${fields.status}`,
    `- **Priority:** ${fields.priority}`,
    `- **Description:** ${fields.description}`,
    '- **Acceptance criteria:',
    criteria,
    `- **Related:** ${related}`,
  ].join('\n')
}

/** Flatten template brief for writer system prompt assembly. */
export function formatFeaturesWriterTemplate(
  template: FeaturesWriterTemplate = FEATURES_WRITER_TEMPLATE,
): string {
  return [
    '## Heading',
    template.headingPattern,
    '',
    '## Required fields',
    ...template.requiredFields.map((line) => `- ${line}`),
    '',
    '## Status values',
    template.statusValues.join(' | '),
    '',
    '## Priority values',
    template.priorityValues.join(' | '),
    '',
    '## Markdown template',
    template.markdownTemplate,
    '',
    '## Add rules',
    ...template.addRules.map((line) => `- ${line}`),
    '',
    '## Update rules',
    ...template.updateRules.map((line) => `- ${line}`),
    '',
    '## Example (F-001)',
    formatFeatureSection(template.example),
  ].join('\n')
}
