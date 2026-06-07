import { GOLDEN_PROMPTS } from './goldenPrompts.ts'
import type { GoldenRouterFixtureCase, RouterPlan } from './types.ts'

/**
 * Canonical expected router JSON per golden prompt — Phase 2 · Job 2.
 * **[USER]** approved 2026-06-06 before golden test runner ships.
 *
 * Summaries are reference wording; the test matcher allows paraphrase.
 * `canvas_ops` empty for v0 router-only golden tests.
 */
const EXPECTED_PLANS: Record<string, RouterPlan> = {
  'gp-01-canvas-pan-zoom': {
    intent_type: 'update_feature',
    summary: 'Users should be able to pan and zoom the canvas.',
    operations: [{ target: 'features.md', action: 'update', entity_id: 'F-001' }],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-02-canvas-layout': {
    intent_type: 'update_feature',
    summary:
      'Reorganize the canvas with Product in the center, Frontend on the left, Backend on the right, and zoom layers between overview and detail.',
    operations: [
      { target: 'features.md', action: 'update', entity_id: 'F-001' },
      { target: 'architecture.md', action: 'update' },
    ],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-03-add-feature': {
    intent_type: 'add_feature',
    summary: 'Add Google login for enterprise users.',
    operations: [
      { target: 'features.md', action: 'add' },
      { target: 'tasks.md', action: 'add' },
    ],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-04-no-realtime': {
    intent_type: 'add_constraint',
    summary: 'Agents must not run in real time on the canvas — batch translator only.',
    operations: [{ target: 'constraints.md', action: 'add' }],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-05-hybrid-storage': {
    intent_type: 'add_decision',
    summary: 'Hybrid storage: Postgres at runtime and export spec markdown on commit.',
    operations: [{ target: 'decisions.md', action: 'add' }],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-06-clarify-domains': {
    intent_type: 'clarify',
    summary: 'Need to know which Google Workspace domains are allowed for SSO.',
    operations: [{ target: 'open-questions.md', action: 'add' }],
    canvas_ops: [],
    open_questions: ['Which Google Workspace domains should be allowed for SSO?'],
  },
  'gp-07-noop-infra': {
    intent_type: 'noop',
    summary: 'Infrastructure setup — not NLIDE product spec content.',
    operations: [],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-08-noop-ui-chrome': {
    intent_type: 'noop',
    summary: 'UI implementation work — not product spec content.',
    operations: [],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-09-update-task': {
    intent_type: 'update_task',
    summary: 'Mark T-001 as done.',
    operations: [{ target: 'tasks.md', action: 'update', entity_id: 'T-001' }],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-10-update-product': {
    intent_type: 'update_product',
    summary:
      'NLIDE is for solo builders and small teams who want to define intent visually before handing work to AI agents.',
    operations: [
      { target: 'product.md', action: 'update' },
      { target: 'users.md', action: 'update' },
    ],
    canvas_ops: [],
    open_questions: [],
  },
  'gp-11-multi-feature': {
    intent_type: 'add_feature',
    summary: 'Add Google login for enterprise users and a dark mode toggle for the canvas.',
    operations: [
      { target: 'features.md', action: 'add', entity_id: 'F-007' },
      { target: 'tasks.md', action: 'add', entity_id: 'T-010' },
      { target: 'features.md', action: 'add', entity_id: 'F-008' },
      { target: 'tasks.md', action: 'add', entity_id: 'T-011' },
    ],
    canvas_ops: [
      { action: 'create_card', type: 'feature', id: 'F-007', link_to: 'product', edge_label: 'contains' },
      { action: 'create_card', type: 'task', id: 'T-010', link_to: 'F-007', edge_label: 'implements' },
      { action: 'create_card', type: 'feature', id: 'F-008', link_to: 'product', edge_label: 'contains' },
      { action: 'create_card', type: 'task', id: 'T-011', link_to: 'F-008', edge_label: 'implements' },
    ],
    open_questions: [],
  },
  'gp-12-compound-mixed': {
    intent_type: 'add_feature',
    summary:
      'Add PDF spec export, constrain v0 to desktop only, and record Claude Sonnet as the router model.',
    operations: [
      { target: 'features.md', action: 'add', entity_id: 'F-007' },
      { target: 'tasks.md', action: 'add', entity_id: 'T-010' },
      { target: 'constraints.md', action: 'add', entity_id: 'C-004' },
      { target: 'decisions.md', action: 'add', entity_id: 'D-004' },
    ],
    canvas_ops: [
      { action: 'create_card', type: 'feature', id: 'F-007', link_to: 'product', edge_label: 'contains' },
      { action: 'create_card', type: 'task', id: 'T-010', link_to: 'F-007', edge_label: 'implements' },
      { action: 'create_card', type: 'constraint', id: 'C-004', link_to: 'product', edge_label: 'constrains' },
      { action: 'create_card', type: 'decision', id: 'D-004', link_to: 'backend', edge_label: 'records' },
    ],
    open_questions: [],
  },
}

function buildFixture(): GoldenRouterFixtureCase[] {
  return GOLDEN_PROMPTS.map((prompt) => {
    const expectedPlan = EXPECTED_PLANS[prompt.id]
    if (!expectedPlan) {
      throw new Error(`Missing expected router plan for golden prompt: ${prompt.id}`)
    }
    return {
      id: prompt.id,
      message: prompt.message,
      expectedPlan,
      expectation: prompt.expectation,
    }
  })
}

export const GOLDEN_ROUTER_FIXTURE: GoldenRouterFixtureCase[] = buildFixture()

export function getGoldenRouterFixture(): GoldenRouterFixtureCase[] {
  return GOLDEN_ROUTER_FIXTURE
}

export function getGoldenRouterFixtureById(id: string): GoldenRouterFixtureCase | undefined {
  return GOLDEN_ROUTER_FIXTURE.find((row) => row.id === id)
}
