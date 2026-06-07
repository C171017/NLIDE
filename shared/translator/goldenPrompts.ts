import type { GoldenPassBar, GoldenPrompt } from './types.ts'

/**
 * Golden router prompts — Phase 1 · Job 5.
 * **[USER]** approved 2026-06-06 after comparison vs intent types (see docs/architecture/router-intent-types-v0.md).
 */
export const GOLDEN_PROMPTS: GoldenPrompt[] = [
  {
    id: 'gp-01-canvas-pan-zoom',
    message: 'Users should be able to pan and zoom the canvas.',
    source: 'router-intent-types-v0 — canvas UX → F-001',
    expectation: {
      intentType: 'update_feature',
      operationTargets: ['features.md'],
      entityIds: ['F-001'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['clarify', 'noop'],
        operationTargets: ['open-questions.md'],
      },
      notes: 'Canvas interaction is product intent, not an open question.',
    },
  },
  {
    id: 'gp-02-canvas-layout',
    message:
      'Reorganize the canvas so Product is in the center, Frontend on the left, Backend on the right, with zoom layers between overview and detail.',
    source: 'router-intent-types-v0 — layered canvas IA',
    expectation: {
      intentType: 'update_feature',
      operationTargets: ['features.md', 'architecture.md'],
      entityIds: ['F-001'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['clarify'],
        operationTargets: ['open-questions.md'],
      },
      notes: 'Touches both feature scope and architecture layout.',
    },
  },
  {
    id: 'gp-03-add-feature',
    message: 'Add Google login for enterprise users.',
    source: 'flow-b-v0 — new capability example',
    expectation: {
      intentType: 'add_feature',
      operationTargets: ['features.md', 'tasks.md'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['clarify', 'noop', 'update_feature'],
        operationTargets: ['open-questions.md'],
      },
      notes: 'New capability → feature row + linked task.',
    },
  },
  {
    id: 'gp-04-no-realtime',
    message: 'Agents must not run in real time on the canvas — batch translator only.',
    source: 'user-decisions — not real-time agent execution',
    expectation: {
      intentType: 'add_constraint',
      operationTargets: ['constraints.md'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['add_decision', 'clarify', 'noop'],
        operationTargets: ['open-questions.md', 'features.md'],
      },
    },
  },
  {
    id: 'gp-05-hybrid-storage',
    message: 'We decided on hybrid storage: Postgres at runtime and export spec markdown on commit.',
    source: 'user-decisions — hybrid spec storage (C)',
    expectation: {
      intentType: 'add_decision',
      operationTargets: ['decisions.md'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['add_constraint', 'clarify', 'noop'],
        operationTargets: ['open-questions.md'],
      },
    },
  },
  {
    id: 'gp-06-clarify-domains',
    message: 'Which Google Workspace domains should be allowed for SSO?',
    source: 'router-intent-types-v0 — real ambiguity',
    expectation: {
      intentType: 'clarify',
      operationTargets: ['open-questions.md'],
      openQuestionsEmpty: false,
      mustNot: {
        intentTypes: ['add_feature', 'noop'],
        operationTargets: ['features.md', 'tasks.md'],
      },
      notes: 'Only open_questions.md — do not guess domains.',
    },
  },
  {
    id: 'gp-07-noop-infra',
    message: 'Set up InsForge for the backend.',
    source: 'router-intent-types-v0 — Cursor/build work',
    expectation: {
      intentType: 'noop',
      operationTargets: [],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['add_feature', 'clarify'],
        operationTargets: ['features.md', 'architecture.md', 'open-questions.md'],
      },
      notes: 'Infrastructure setup belongs in Cursor, not NLIDE chat spec.',
    },
  },
  {
    id: 'gp-08-noop-ui-chrome',
    message: 'Add a progress bar to the canvas checklist card.',
    source: 'router-intent-types-v0 — building NLIDE in Cursor',
    expectation: {
      intentType: 'noop',
      operationTargets: [],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['update_feature', 'clarify'],
        operationTargets: ['features.md', 'open-questions.md'],
      },
      notes: 'UI implementation work — not product spec content.',
    },
  },
  {
    id: 'gp-09-update-task',
    message: 'Mark T-001 as done.',
    source: 'router-intent-types-v0 — task status change',
    expectation: {
      intentType: 'update_task',
      operationTargets: ['tasks.md'],
      entityIds: ['T-001'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['update_feature', 'clarify', 'noop'],
        operationTargets: ['open-questions.md'],
      },
    },
  },
  {
    id: 'gp-10-update-product',
    message:
      'NLIDE is for solo builders and small teams who want to define intent visually before handing work to AI agents.',
    source: 'router-intent-types-v0 — product vision / users',
    expectation: {
      intentType: 'update_product',
      operationTargets: ['product.md', 'users.md'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['clarify', 'noop', 'add_feature'],
        operationTargets: ['open-questions.md'],
      },
    },
  },
  {
    id: 'gp-11-multi-feature',
    message: 'Add Google login for enterprise users and add a dark mode toggle for the canvas.',
    source: 'compound intents — multiple features in one message',
    expectation: {
      intentType: 'add_feature',
      operationTargets: ['features.md', 'tasks.md'],
      entityIds: ['F-007', 'F-008', 'T-010', 'T-011'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['clarify', 'noop'],
        operationTargets: ['open-questions.md'],
      },
      notes: 'Two features + paired tasks; router emits explicit canvas_ops[] with four create_card ops.',
    },
  },
  {
    id: 'gp-12-compound-mixed',
    message:
      'Add export to PDF for the spec, no mobile support in v0, and we decided to use Claude Sonnet for the router.',
    source: 'compound intents — cross-type feature + constraint + decision',
    expectation: {
      intentType: 'add_feature',
      operationTargets: ['features.md', 'tasks.md', 'constraints.md', 'decisions.md'],
      entityIds: ['F-007', 'T-010', 'C-004', 'D-004'],
      openQuestionsEmpty: true,
      mustNot: {
        intentTypes: ['clarify', 'noop'],
        operationTargets: ['open-questions.md'],
      },
      notes: 'Dominant add_feature; three card types in one canvas_ops[] sequence.',
    },
  },
]

/** **[USER]** locked v0 (2026-06-06) — Phase 1 · Job 6; ≥10/12 before Phase 2 router ship (includes compound cases). */
export const GOLDEN_PASS_BAR: GoldenPassBar = {
  minPass: 10,
  description: '≥10/12 golden prompts pass via action:"route" + Zod validation',
}
