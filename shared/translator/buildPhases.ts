import type { BuildPhase } from './types.ts'

/**
 * Instruction-writing phases for the NLIDE translator.
 * Each phase = human approves jobs → 100% → Agent mode implements that slice.
 */
export const BUILD_PHASES: BuildPhase[] = [
  {
    id: 'phase-0-preview-loop',
    order: 0,
    title: 'Phase 0: Preview loop',
    plainSummary: 'Canvas chat shows preview; you commit or discard.',
    agentModeGoal: 'Stub preview → commit UX (shipped)',
    status: 'done',
    checklistId: 'phase-0-preview-loop',
    jobs: [
      {
        id: 'preview-commit-ux',
        label: 'Preview → commit / discard works',
        detail: 'Chat bar, ghost preview, Postgres preview storage',
      },
    ],
  },
  {
    id: 'phase-1-router-contract',
    order: 1,
    title: 'Phase 1: Router contract',
    plainSummary: 'Fixed intent types + routing rules before any LLM router code.',
    agentModeGoal: 'Implement routeIntent(), action:"route", Zod validation',
    status: 'done',
    checklistId: 'phase-1-router-contract',
    jobs: [
      {
        id: 'routing-policy',
        label: 'Routing policy & intent types',
        detail: 'Approved list in shared/translator/intentTypes.ts',
      },
      {
        id: 'intent-type-enum',
        label: 'intent_type enum locked',
        detail: 'Ten types: add_feature … noop',
      },
      {
        id: 'schema-fields',
        label: 'Hardcoded schema fields',
        detail: 'summary, operations[], canvas_ops[], open_questions[]',
      },
      {
        id: 'spec-allowlist',
        label: 'Spec file allowlist',
        detail: 'Flow B nine files only',
      },
      {
        id: 'golden-prompts',
        label: 'Golden prompts (8–10 cases)',
        detail: 'Message + expected intent_type + targets + must-not rules',
      },
      {
        id: 'pass-bar',
        label: 'Pass bar for router tests',
        detail: 'e.g. ≥8/10 golden prompts pass via action:"route" + Zod',
      },
    ],
  },
  {
    id: 'phase-2-router-build',
    order: 2,
    title: 'Phase 2: Router build brief',
    plainSummary: 'Instructions for wiring Claude + golden tests.',
    agentModeGoal: 'Ship LLM router, golden test runner, tune until pass bar',
    status: 'done',
    checklistId: 'phase-2-router-build',
    jobs: [
      {
        id: 'router-system-prompt',
        label: 'Router system prompt outline',
        detail: 'Intent types + routing rules + context format',
      },
      {
        id: 'golden-fixture',
        label: 'Golden test fixture file',
        detail: 'Checked-in prompts + expected JSON plans',
      },
      {
        id: 'failure-behavior',
        label: 'Invalid JSON / Zod failure behavior',
        detail: 'Fail loud — no silent fallback to stub',
      },
      {
        id: 'router-smoke',
        label: 'Manual smoke invoke documented',
        detail: 'insforge functions invoke action:route',
      },
    ],
  },
  {
    id: 'phase-3-features-writer',
    order: 3,
    title: 'Phase 3: Features writer brief',
    plainSummary: 'How features.md patches should read.',
    agentModeGoal: 'Implement features.md writer from router operations',
    status: 'done',
    checklistId: 'phase-3-features-writer',
    jobs: [
      {
        id: 'feature-md-template',
        label: 'Feature section template',
        detail: 'ID, status, priority, description, acceptance criteria',
      },
      {
        id: 'acceptance-criteria-rules',
        label: 'Acceptance criteria bar',
        detail: 'What “good enough” means before commit',
      },
      {
        id: 'features-golden',
        label: 'Golden writer examples (3+)',
        detail: 'Router op → expected features.md patch',
      },
    ],
  },
  {
    id: 'phase-4-writers-validator',
    order: 4,
    title: 'Phase 4: All writers + validator',
    plainSummary: 'Remaining spec files and validation strictness.',
    agentModeGoal: 'All writers + ID/link validator',
    status: 'active',
    checklistId: 'phase-4-writers-validator',
    jobs: [
      {
        id: 'task-writer-rules',
        label: 'Task writer rules',
        detail: 'Instructions for agent, done-when, feature links',
      },
      {
        id: 'validator-strictness',
        label: 'Validator strictness',
        detail: 'Block vs warn: duplicates, orphans, contradictions',
      },
      {
        id: 'remaining-writers',
        label: 'Writer order for remaining files',
        detail: 'product, users, architecture, constraints, decisions, open-questions',
      },
    ],
  },
  {
    id: 'phase-5-canvas-mapper',
    order: 5,
    title: 'Phase 5: Canvas mapper brief',
    plainSummary: 'How MD patches become preview cards and edges.',
    agentModeGoal: 'Canvas mapper + preview diff on canvas',
    status: 'upcoming',
    checklistId: 'phase-5-canvas-mapper',
    jobs: [
      {
        id: 'placement-rules',
        label: 'Card placement rules',
        detail: 'Near related nodes; auto-layout vs preserve drag',
      },
      {
        id: 'canvas-ops-mapping',
        label: 'canvas_ops → cards/edges',
        detail: 'create_card, link_to, preview styling',
      },
      {
        id: 'preview-diff-rules',
        label: 'Preview vs committed visuals',
        detail: 'Ghost cards, mdPatches summary',
      },
    ],
  },
  {
    id: 'phase-6-export',
    order: 6,
    title: 'Phase 6: Export on commit',
    plainSummary: 'Hybrid storage: Postgres + /spec/*.md export.',
    agentModeGoal: 'Commit writes spec/ files; replace stub end-to-end',
    status: 'upcoming',
    checklistId: 'phase-6-export',
    jobs: [
      {
        id: 'export-scope',
        label: 'Export scope on commit',
        detail: 'Full spec/ tree vs delta files',
      },
      {
        id: 'spec-folder-layout',
        label: 'spec/ folder layout',
        detail: 'Matches Flow B v0 file list',
      },
      {
        id: 'end-to-end-smoke',
        label: 'End-to-end smoke path',
        detail: 'Chat → preview → commit → spec/ on disk',
      },
    ],
  },
]

export function getPhaseByChecklistId(checklistId: string): BuildPhase | undefined {
  return BUILD_PHASES.find((phase) => phase.checklistId === checklistId)
}

export function countJobsInPhase(phase: BuildPhase): number {
  return phase.jobs.length
}
