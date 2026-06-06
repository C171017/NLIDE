/**
 * Remaining spec writers — implementation order & section briefs — Phase 4 · Job 3.
 * **[USER]** approved 2026-06-06 before remaining writer LLMs ship.
 *
 * features.md and tasks.md writers are defined separately (Phase 3 + Phase 4 Job 1).
 * This brief covers product, users, architecture, constraints, decisions, open-questions.
 */

export type RemainingWriterId =
  | 'constraints'
  | 'decisions'
  | 'open-questions'
  | 'product'
  | 'users'
  | 'architecture'

export interface RemainingWriterBrief {
  id: RemainingWriterId
  targetFile: string
  order: number
  intentTypes: string[]
  cardModel: 'per-file' | 'per-entity'
  idPattern?: string
  headingPattern?: string
  requiredFields: string[]
  markdownTemplate: string
  addRules: string[]
  updateRules: string[]
  example: string
}

export interface RemainingWritersOrder {
  policy: string
  invocationRules: string[]
  /** Build order for Phase 4 Agent mode — simplest / most isolated first */
  implementationOrder: RemainingWriterId[]
  /** Already briefed — ship with or immediately after features writer */
  shippedBriefs: string[]
  writers: RemainingWriterBrief[]
  deferred: string[]
  explicitNonGoals: string[]
}

export const REMAINING_WRITERS_ORDER: RemainingWritersOrder = {
  policy:
    'One LLM writer call per spec file per router turn. Writers run after router, in parallel ' +
    'when multiple files are targeted. Each writer patches only its file using the section shapes below.',

  invocationRules: [
    'Router operations[] drives which writers run — no writer for files not in operations[].',
    'features.md + tasks.md writers run first when co-targeted (task links need feature ID).',
    'product.md + users.md may run in parallel on update_product.',
    'architecture.md runs independently on update_architecture (may parallel with features on gp-02).',
    'clarify → open-questions writer only; all other writers skipped.',
    'noop → no writers.',
  ],

  implementationOrder: [
    'constraints',
    'decisions',
    'open-questions',
    'product',
    'users',
    'architecture',
  ],

  shippedBriefs: [
    'features.md — featuresWriterTemplate.ts (Phase 3)',
    'tasks.md — taskWriterRules.ts (Phase 4 Job 1)',
    'validator — validatorStrictness.ts (Phase 4 Job 2)',
  ],

  writers: [
    {
      id: 'constraints',
      targetFile: 'constraints.md',
      order: 1,
      intentTypes: ['add_constraint'],
      cardModel: 'per-file',
      requiredFields: [
        'stack — tech choices when user states them (React, InsForge, Postgres, etc.)',
        'patterns — how agents should approach work (intent not code, preview→commit, etc.)',
        'non-goals — explicit out-of-scope items ("No SMS auth", "No Flow C in v0")',
      ],
      markdownTemplate: `## Stack
- {stack_item}

## Patterns
- {pattern_item}

## Non-goals
- {non_goal_item}`,

      addRules: [
        'add_constraint → append bullet under the matching section (stack / patterns / non-goals).',
        'Infer section from user message; default non-goals when user says "not", "no", "out of scope".',
        'Do not duplicate an existing bullet — merge or skip if same meaning.',
        'Intent wording only — no file paths as primary constraint content.',
      ],

      updateRules: [
        'Router update on constraints.md → patch matching bullet or section; preserve other constraints.',
        'Never delete a constraint unless user explicitly removes scope.',
      ],

      example: `## Stack
- React + Vite frontend; InsForge edge functions; Postgres runtime state

## Patterns
- Intent MD describes what should exist, not how existing code works
- Chat → preview → commit; never auto-apply translator output

## Non-goals
- No real-time agent execution on the canvas (batch translator only)
- Flow C in-app code execution out of v0 scope`,
    },
    {
      id: 'decisions',
      targetFile: 'decisions.md',
      order: 2,
      intentTypes: ['add_decision'],
      cardModel: 'per-entity',
      idPattern: 'D-xxx',
      headingPattern: '### {id}: {title}',
      requiredFields: [
        'id — stable D-xxx (assigned on add)',
        'title — short decision name',
        'date — ISO date when recorded',
        'decision — what was chosen, one or two sentences',
        'context — why this was decided or what it affects',
        'status — locked | superseded',
      ],
      markdownTemplate: `### {id}: {title}

- **Date:** {date}
- **Decision:** {decision}
- **Context:** {context}
- **Status:** locked`,

      addRules: [
        'add_decision → allocate next free D-xxx; default status locked.',
        'Use user message tense: "we decided", "locked", "going with" → add_decision not add_constraint.',
        'Record the choice, not implementation steps.',
      ],

      updateRules: [
        'Supersede prior decision → set old D-xxx status superseded; add new D-xxx for replacement.',
        'Do not delete decision sections — ADR-style history.',
      ],

      example: `### D-001: Hybrid spec storage

- **Date:** 2026-06-06
- **Decision:** Postgres at runtime; export /spec/*.md on commit
- **Context:** Canvas and API need live state; external agents read markdown export
- **Status:** locked`,
    },
    {
      id: 'open-questions',
      targetFile: 'open-questions.md',
      order: 3,
      intentTypes: ['clarify'],
      cardModel: 'per-entity',
      idPattern: 'OQ-xxx',
      headingPattern: '### {id}: {title}',
      requiredFields: [
        'id — stable OQ-xxx (assigned on add)',
        'title — short question topic',
        'status — open | resolved',
        'question — exact question for the user',
        'context — what feature or decision this blocks (optional)',
        'options — bullet list when user gave choices (optional)',
      ],
      markdownTemplate: `### {id}: {title}

- **Status:** open
- **Question:** {question}
- **Context:** {context}
- **Options:**
  - {option_1}`,

      addRules: [
        'clarify only → writer runs for open-questions.md; must not patch other files.',
        'open_questions[] in router plan must match the written question text.',
        'Do not invent an answer or default choice — question only.',
        'One OQ-xxx per distinct ambiguity in the message.',
      ],

      updateRules: [
        'When user answers → set status resolved; move answer to decisions.md or target feature (separate router turn).',
        'Do not auto-resolve open questions on clarify add.',
      ],

      example: `### OQ-001: Google Workspace domain allowlist

- **Status:** open
- **Question:** Which Google Workspace domains should be allowed for SSO?
- **Context:** Blocks enterprise login feature F-002 domain restriction criterion
- **Options:**
  - Single company domain only
  - Configurable allowlist per deployment`,
    },
    {
      id: 'product',
      targetFile: 'product.md',
      order: 4,
      intentTypes: ['update_product'],
      cardModel: 'per-file',
      requiredFields: [
        'vision — one paragraph what NLIDE / the project is',
        'goals — bullet list of what we are trying to achieve',
        'scope — what is in v0 / current phase',
        'non-goals — high-level product exclusions (may mirror constraints)',
      ],
      markdownTemplate: `## Vision
{vision_paragraph}

## Goals
- {goal}

## Scope
- {scope_item}

## Non-goals
- {non_goal}`,

      addRules: [
        'update_product → merge into existing sections; product.md is usually one rolling doc.',
        'Vision changes when user reframes who/what/why at product level.',
        'Do not list implementation tasks here — those belong in tasks.md.',
      ],

      updateRules: [
        'Append goals/scope bullets when user adds scope; replace vision only when user reframes whole product.',
        'Keep language intent-level — not stack details (stack → constraints.md).',
      ],

      example: `## Vision
NLIDE is an IDE for intent: solo builders and small teams define what to build visually before handing work to AI agents.

## Goals
- Capture user intent as structured, agent-executable markdown
- Visual canvas with linked cards backed by spec files
- Preview → commit gate before spec changes apply

## Scope
- Flow B: human input → intent MD (v0 focus)
- Canvas, structure, knowledge, visualization

## Non-goals
- In-app code execution (Flow C)
- Real-time streaming copilot on canvas`,
    },
    {
      id: 'users',
      targetFile: 'users.md',
      order: 5,
      intentTypes: ['update_product'],
      cardModel: 'per-file',
      requiredFields: [
        'primary users — who the product is for',
        'personas — named roles with one-line description (optional)',
        'pain points — problems we solve',
        'use cases — how they use the product (optional)',
      ],
      markdownTemplate: `## Primary users
{primary_users}

## Personas
- **{persona_name}** — {description}

## Pain points
- {pain_point}

## Use cases
- {use_case}`,

      addRules: [
        'Often co-targeted with product.md on update_product — run both writers in parallel.',
        'Derive personas from user message; do not invent enterprise personas user did not imply.',
        'Pain points should be user-facing, not technical debt.',
      ],

      updateRules: [
        'Merge new personas and pain points; do not remove existing unless user narrows scope.',
      ],

      example: `## Primary users
Solo builders and small teams shipping with AI coding agents.

## Personas
- **Solo builder** — defines features on canvas, exports spec, hands off to Cursor
- **Small team lead** — keeps shared intent doc aligned before agent sprints

## Pain points
- Natural language intent scattered across chats and notes
- Agents guess scope without acceptance criteria
- Hard to see how features, tasks, and architecture connect

## Use cases
- Describe a feature in chat → review structured spec → commit → export for external agents`,
    },
    {
      id: 'architecture',
      targetFile: 'architecture.md',
      order: 6,
      intentTypes: ['update_architecture', 'update_feature'],
      cardModel: 'per-file',
      requiredFields: [
        'overview — high-level system description (intent level)',
        'components — named parts and responsibilities',
        'relationships — how components connect (text or mermaid-friendly list)',
        'canvas IA — when message is about layout/layers (optional section)',
      ],
      markdownTemplate: `## Overview
{overview}

## Components
- **{component}** — {responsibility}

## Relationships
- {from} → {to}: {relationship}

## Canvas IA
- {layout_rule}`,

      addRules: [
        'update_architecture → patch architecture.md; intent-level components only.',
        'On gp-02-style messages router may also target features.md — architecture writer handles layout/structure only.',
        'Mermaid-friendly relationship bullets allowed; no React component file paths as primary content.',
        'Frontend / Backend / Product pillar layout belongs in Canvas IA section when relevant.',
      ],

      updateRules: [
        'Merge new components and relationships; update Canvas IA when user changes layout model.',
        'Do not duplicate feature acceptance criteria — link to F-xxx in prose if needed.',
      ],

      example: `## Overview
React web app with InsForge edge functions and Postgres; translator pipeline produces intent spec.

## Components
- **Canvas UI** — linked cards, layered navigation, human-readable editing
- **Translator API** — router → writers → validator → preview
- **Spec store** — Postgres runtime + markdown export on commit

## Relationships
- Canvas UI → Translator API: chat submit with full project context
- Translator API → Spec store: preview rows; commit writes cards and /spec export

## Canvas IA
- Overview layer: Frontend (left), Product (center), Backend (right)
- Detail layer: drill into pillar on click; pan/zoom between overview and detail`,
    },
  ],

  deferred: [
    'INDEX.md writer — regenerated on commit/export (Phase 6), not per-router-turn in v0.',
    'Per-writer golden fixtures — optional Phase 4 Agent mode stretch; router golden covers routing.',
  ],

  explicitNonGoals: [
    'No single mega-writer prompt for all nine files.',
    'No writer invents F-xxx / T-xxx / D-xxx / OQ-xxx outside its ID pattern.',
    'No architecture writer emits npm install steps or file-level implementation plans.',
  ],
}

/** Flatten brief for Agent mode or docs. */
export function formatRemainingWritersOrder(
  order: RemainingWritersOrder = REMAINING_WRITERS_ORDER,
): string {
  const writerBlocks = order.writers
    .sort((a, b) => a.order - b.order)
    .map((w) => {
      const lines = [
        `## ${w.order}. ${w.targetFile} (${w.id})`,
        `Intent types: ${w.intentTypes.join(', ')}`,
        `Card model: ${w.cardModel}${w.idPattern ? ` · IDs ${w.idPattern}` : ''}`,
        '',
        '### Required fields',
        ...w.requiredFields.map((f) => `- ${f}`),
        '',
        '### Markdown template',
        w.markdownTemplate,
        '',
        '### Add rules',
        ...w.addRules.map((r) => `- ${r}`),
        '',
        '### Update rules',
        ...w.updateRules.map((r) => `- ${r}`),
        '',
        '### Example',
        w.example,
      ]
      return lines.join('\n')
    })
    .join('\n\n')

  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  return [
    '## Policy',
    order.policy,
    '',
    section('Invocation rules', order.invocationRules),
    '',
    '## Implementation order (Agent mode)',
    ...order.implementationOrder.map((id, i) => `${i + 1}. ${id}`),
    '',
    section('Already briefed', order.shippedBriefs),
    '',
    writerBlocks,
    '',
    section('Deferred', order.deferred),
    '',
    section('Explicit non-goals', order.explicitNonGoals),
  ].join('\n')
}

export function getWriterBriefByFile(
  targetFile: string,
  order: RemainingWritersOrder = REMAINING_WRITERS_ORDER,
): RemainingWriterBrief | undefined {
  return order.writers.find((w) => w.targetFile === targetFile)
}

export function getWritersForIntentType(
  intentType: string,
  order: RemainingWritersOrder = REMAINING_WRITERS_ORDER,
): RemainingWriterBrief[] {
  return order.writers.filter((w) => w.intentTypes.includes(intentType))
}
