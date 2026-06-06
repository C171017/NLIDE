/**
 * Canvas mapper golden fixtures — Phase 5.
 * Tests mapCanvasToPreview against sample canvas + router plans (no LLM).
 */

import { mapCanvasToPreview } from './canvasMapper.ts'
import { diffPreview } from './diffPreview.ts'
import type { CanvasCard, CanvasEdge } from './canvasTypes.ts'
import type { RouterPlan } from './types.ts'
import { GOLDEN_ROUTER_FIXTURE } from './goldenRouterFixture.ts'

export interface CanvasMapperExpectation {
  ghostCardIds?: string[]
  ghostEdgeCountMin?: number
  ghostEdgeCountMax?: number
  ghostEdgeLabels?: string[]
  updatedInPlaceIds?: string[]
  mdPatchFiles?: string[]
  mdPatchCountMin?: number
  summaryIncludes?: string
  noNewCards?: boolean
}

export interface CanvasMapperGoldenCase {
  id: string
  label: string
  plan: RouterPlan
  message?: string
  expectation: CanvasMapperExpectation
}

/** Minimal demo canvas — mirrors frontend sampleProject pillars + features table. */
export const DEMO_CANVAS_CARDS: CanvasCard[] = [
  {
    id: 'product',
    specRef: { file: 'product.md' },
    type: 'product',
    title: 'NLIDE',
    body: 'Natural Language IDE',
    position: { x: 0, y: 0 },
    layer: 0,
    status: 'approved',
  },
  {
    id: 'frontend',
    specRef: { file: 'architecture.md', anchor: 'frontend' },
    type: 'frontend',
    title: 'Frontend',
    body: 'React canvas UI',
    position: { x: -520, y: 0 },
    layer: 0,
    status: 'in_progress',
  },
  {
    id: 'backend',
    specRef: { file: 'architecture.md', anchor: 'backend' },
    type: 'backend',
    title: 'Backend',
    body: 'InsForge edge functions',
    position: { x: 520, y: 0 },
    layer: 0,
    status: 'in_progress',
  },
  {
    id: 'features',
    specRef: { file: 'features.md', anchor: 'F-001' },
    type: 'feature',
    title: 'F-001: Intent canvas',
    body: 'Pannable canvas with links.',
    position: { x: 0, y: 280 },
    layer: 1,
    parentCardId: 'product',
    status: 'in_progress',
    vizType: 'data-table',
    vizPayload: {
      columns: ['ID', 'Title', 'Status', 'Priority'],
      rows: [
        ['F-001', 'Intent canvas', 'in_progress', 'high'],
        ['F-002', 'Chat → preview → commit', 'proposed', 'high'],
        ['F-003', 'Manual card editing', 'proposed', 'medium'],
      ],
    },
  },
  {
    id: 'tasks',
    specRef: { file: 'tasks.md', anchor: 'T-001' },
    type: 'task',
    title: 'T-001: Build React Flow canvas',
    body: 'Layered canvas implementation.',
    position: { x: -520, y: 280 },
    layer: 1,
    parentCardId: 'frontend',
    status: 'in_progress',
  },
]

export const DEMO_CANVAS_EDGES: CanvasEdge[] = [
  { id: 'e-product-frontend', source: 'product', target: 'frontend', label: 'has' },
  { id: 'e-product-backend', source: 'product', target: 'backend', label: 'has' },
  { id: 'e-product-features', source: 'product', target: 'features', label: 'contains' },
  { id: 'e-frontend-tasks', source: 'frontend', target: 'tasks', label: 'implements' },
]

function planFromFixture(promptId: string): RouterPlan {
  const row = GOLDEN_ROUTER_FIXTURE.find((caseRow) => caseRow.id === promptId)
  if (!row) throw new Error(`Missing golden router fixture: ${promptId}`)
  return row.expectedPlan
}

export const CANVAS_MAPPER_GOLDEN: CanvasMapperGoldenCase[] = [
  {
    id: 'cm-gp03-add-feature',
    label: 'Derive F-004 table row + T-002 task from add_feature (gp-03)',
    plan: planFromFixture('gp-03-add-feature'),
    message: 'Add Google login for enterprise users.',
    expectation: {
      ghostCardIds: ['T-002'],
      updatedInPlaceIds: ['features'],
      ghostEdgeCountMin: 1,
      mdPatchFiles: ['features.md', 'tasks.md'],
      summaryIncludes: 'Google login',
    },
  },
  {
    id: 'cm-gp06-clarify',
    label: 'Derive open-question from clarify (gp-06)',
    plan: planFromFixture('gp-06-clarify-domains'),
    message: 'Which Google Workspace domains should be allowed for SSO?',
    expectation: {
      ghostCardIds: ['OQ-001'],
      ghostEdgeLabels: ['raises'],
      mdPatchFiles: ['open-questions.md'],
      summaryIncludes: 'domains',
    },
  },
  {
    id: 'cm-gp01-update-feature',
    label: 'Update F-001 in place (gp-01)',
    plan: planFromFixture('gp-01-canvas-pan-zoom'),
    expectation: {
      noNewCards: true,
      updatedInPlaceIds: ['features'],
      mdPatchFiles: ['features.md'],
    },
  },
  {
    id: 'cm-explicit-ops',
    label: 'Explicit canvas_ops create F-005 + T-005',
    plan: {
      intent_type: 'add_feature',
      summary: 'Add SSO feature with implementation task.',
      operations: [
        { target: 'features.md', action: 'add', entity_id: 'F-005' },
        { target: 'tasks.md', action: 'add', entity_id: 'T-005' },
      ],
      canvas_ops: [
        {
          action: 'create_card',
          type: 'feature',
          id: 'F-005',
          link_to: 'product',
          edge_label: 'contains',
          title: 'F-005: Enterprise SSO',
          body: 'Single sign-on for enterprise tenants.',
        },
        {
          action: 'create_card',
          type: 'task',
          id: 'T-005',
          link_to: 'F-005',
          edge_label: 'implements',
          title: 'T-005: Implement SSO',
          body: 'Wire OAuth provider flow.',
        },
      ],
      open_questions: [],
    },
    expectation: {
      ghostCardIds: ['F-005', 'T-005'],
      ghostEdgeCountMin: 2,
    },
  },
  {
    id: 'cm-noop',
    label: 'noop — md-only / unchanged canvas',
    plan: planFromFixture('gp-07-noop-infra'),
    expectation: {
      noNewCards: true,
      mdPatchCountMin: 0,
    },
  },
]

export interface CanvasMapperMatchResult {
  pass: boolean
  caseId: string
  failures: string[]
}

export function evaluateCanvasMapperGolden(
  golden: CanvasMapperGoldenCase,
  cards: CanvasCard[] = DEMO_CANVAS_CARDS,
  edges: CanvasEdge[] = DEMO_CANVAS_EDGES,
): CanvasMapperMatchResult {
  const failures: string[] = []

  const preview = mapCanvasToPreview({
    committedCards: cards,
    committedEdges: edges,
    centerCardId: 'product',
    routerPlan: golden.plan,
    userMessage: golden.message,
    previewId: `preview-golden-${golden.id}`,
  })

  const { previewCardIds, previewEdgeIds } = diffPreview(cards, edges, preview.cards, preview.edges)
  const exp = golden.expectation

  if (exp.summaryIncludes && !preview.summary.toLowerCase().includes(exp.summaryIncludes.toLowerCase())) {
    failures.push(`summary missing "${exp.summaryIncludes}"`)
  }

  if (exp.noNewCards && previewCardIds.size > 0) {
    failures.push(`expected no new cards, got ${[...previewCardIds].join(', ')}`)
  }

  for (const id of exp.ghostCardIds ?? []) {
    if (!previewCardIds.has(id)) {
      failures.push(`missing ghost card: ${id}`)
    }
  }

  if (exp.ghostEdgeCountMin !== undefined && previewEdgeIds.size < exp.ghostEdgeCountMin) {
    failures.push(`expected ≥${exp.ghostEdgeCountMin} ghost edges, got ${previewEdgeIds.size}`)
  }

  if (exp.ghostEdgeCountMax !== undefined && previewEdgeIds.size > exp.ghostEdgeCountMax) {
    failures.push(`expected ≤${exp.ghostEdgeCountMax} ghost edges, got ${previewEdgeIds.size}`)
  }

  if (exp.ghostEdgeLabels?.length) {
    const previewEdges = preview.edges.filter((edge) => previewEdgeIds.has(edge.id))
    for (const label of exp.ghostEdgeLabels) {
      if (!previewEdges.some((edge) => edge.label === label)) {
        failures.push(`missing ghost edge label: ${label}`)
      }
    }
  }

  for (const id of exp.updatedInPlaceIds ?? []) {
    const before = findCard(cards, id)
    const after = findCard(preview.cards, id)
    if (!before || !after) {
      failures.push(`updated card not found: ${id}`)
      continue
    }
    if (previewCardIds.has(after.id)) {
      failures.push(`${id} should update in place, not ghost`)
    }
  }

  if (exp.mdPatchFiles?.length) {
    for (const file of exp.mdPatchFiles) {
      if (!preview.mdPatches.some((patch) => patch.file === file)) {
        failures.push(`missing mdPatch for ${file}`)
      }
    }
  }

  if (exp.mdPatchCountMin !== undefined && preview.mdPatches.length < exp.mdPatchCountMin) {
    failures.push(`expected ≥${exp.mdPatchCountMin} mdPatches, got ${preview.mdPatches.length}`)
  }

  return { pass: failures.length === 0, caseId: golden.id, failures }
}

function findCard(cards: CanvasCard[], idOrAnchor: string): CanvasCard | undefined {
  return (
    cards.find((card) => card.id === idOrAnchor) ??
    cards.find((card) => card.specRef.anchor === idOrAnchor)
  )
}

export const CANVAS_MAPPER_PASS_BAR = {
  minPass: 4,
  total: CANVAS_MAPPER_GOLDEN.length,
  description: '≥4/5 canvas mapper golden cases pass without LLM',
}

export function scoreCanvasMapperResults(results: CanvasMapperMatchResult[]): {
  passCount: number
  total: number
  passedBar: boolean
  results: CanvasMapperMatchResult[]
} {
  const passCount = results.filter((row) => row.pass).length
  return {
    passCount,
    total: results.length,
    passedBar: passCount >= CANVAS_MAPPER_PASS_BAR.minPass,
    results,
  }
}

export function runCanvasMapperGolden(): ReturnType<typeof scoreCanvasMapperResults> {
  const results = CANVAS_MAPPER_GOLDEN.map((golden) => evaluateCanvasMapperGolden(golden))
  return scoreCanvasMapperResults(results)
}
