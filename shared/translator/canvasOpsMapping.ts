/**
 * canvas_ops → cards/edges mapping — Phase 5 · Job 2.
 * **[USER]** approved 2026-06-06 before canvas mapper ships.
 *
 * How router `canvas_ops[]` (and fallbacks from `operations[]`) become preview
 * cards and edges with ghost styling on the canvas.
 */

import type { CardType as PlacementCardType } from './canvasPlacementRules.ts'

export type CanvasOpAction = 'create_card' | 'link_to' | 'update_card'

/** Router canvas_ops `type` — matches CardType minus demo-only `index`. */
export type CanvasOpCardType = PlacementCardType

export interface CreateCardOp {
  action: 'create_card'
  type: CanvasOpCardType
  /** Entity id (F-002, T-003, OQ-001) — becomes card.id and specRef.anchor when present. */
  id: string
  /** Target card id for the first edge; `product` or `index` = center hub. */
  link_to: string
  title?: string
  body?: string
  status?: 'proposed' | 'approved' | 'in_progress' | 'done'
  edge_label?: string
}

export interface LinkToOp {
  action: 'link_to'
  source: string
  target: string
  label?: string
}

export interface UpdateCardOp {
  action: 'update_card'
  id: string
  title?: string
  body?: string
  status?: 'proposed' | 'approved' | 'in_progress' | 'done'
}

export type CanvasOp = CreateCardOp | LinkToOp | UpdateCardOp

export interface CanvasOpsExample {
  id: string
  label: string
  canvas_ops: CanvasOp[]
  notes: string
}

export interface CanvasOpsMapping {
  policy: string
  allowedActions: string[]
  createCardFields: string[]
  linkToFields: string[]
  updateCardFields: string[]
  linkToAliases: string[]
  defaultEdgeLabels: { fromType: CanvasOpCardType | 'product'; toType: CanvasOpCardType; label: string }[]
  idConventions: string[]
  deriveWhenEmpty: string[]
  previewCardStyling: string[]
  previewEdgeStyling: string[]
  mapperPipeline: string[]
  examples: CanvasOpsExample[]
  explicitNonGoals: string[]
}

export const CANVAS_OPS_MAPPING: CanvasOpsMapping = {
  policy:
    'Router `canvas_ops[]` is the primary input for new preview cards and edges. When empty (v0 router ' +
    'golden tests), the mapper derives minimal ops from `operations[]` + writer entity ids. Compound turns ' +
    'emit ordered `canvas_ops[]` with one create_card per ask; order becomes `previewCardIds`. Preview-only ' +
    'nodes get ghost styling; committed cards are never restyled.',

  allowedActions: [
    'create_card — new preview card + optional first edge via link_to',
    'link_to — edge between existing or same-preview cards',
    'update_card — patch title/body/status on existing card; never reposition (see placement rules)',
  ],

  createCardFields: [
    'action — "create_card"',
    'type — product | frontend | backend | users | feature | task | architecture | constraint | decision | open-question',
    'id — stable entity id (F-002, T-003, D-001, OQ-001); used as card.id when no collision',
    'link_to — source id for default edge (product, frontend, backend, features, or entity id)',
    'title — optional; mapper fills from writer section heading when omitted',
    'body — optional; mapper fills from writer excerpt when omitted',
    'status — optional; default proposed for new cards, preserve existing on update',
    'edge_label — optional; overrides default label for link_to edge',
  ],

  linkToFields: [
    'action — "link_to"',
    'source — card id (entity id or pillar id)',
    'target — card id',
    'label — optional edge label; see defaultEdgeLabels when omitted',
  ],

  updateCardFields: [
    'action — "update_card"',
    'id — existing card id or specRef.anchor match',
    'title?, body?, status? — patch only; no position/layer/parentCardId changes',
  ],

  linkToAliases: [
    'index → centerCardId (product hub)',
    'product → product pillar card',
    'features → aggregate features card id "features" when demo table not yet split per F-xxx',
    'Entity ids (F-001, T-002) resolve to card by id first, then specRef.anchor',
  ],

  defaultEdgeLabels: [
    { fromType: 'product', toType: 'feature', label: 'contains' },
    { fromType: 'product', toType: 'users', label: 'serves' },
    { fromType: 'product', toType: 'constraint', label: 'constrains' },
    { fromType: 'frontend', toType: 'task', label: 'implements' },
    { fromType: 'feature', toType: 'task', label: 'implements' },
    { fromType: 'backend', toType: 'architecture', label: 'describes' },
    { fromType: 'backend', toType: 'decision', label: 'records' },
    { fromType: 'feature', toType: 'open-question', label: 'raises' },
    { fromType: 'product', toType: 'open-question', label: 'raises' },
  ],

  idConventions: [
    'New entity cards use router/writer entity id as card.id (e.g. F-002, T-003).',
    'Pillar cards use fixed ids: product, frontend, backend.',
    'Edge ids: e-{source}-{target} or e-preview-{nanoid} when duplicate pair.',
    'specRef.file from operations[].target; specRef.anchor from entity id.',
    'layer and parentCardId from canvasPlacementRules.getDefaultAnchor(type).',
  ],

  deriveWhenEmpty: [
    'add_feature + entity F-xxx → create_card feature + link_to product; add tasks similarly under frontend or F-xxx.',
    'add_task + entity T-xxx → create_card task + link_to linked feature or frontend.',
    'clarify + OQ-xxx → create_card open-question + link_to product or triggering feature.',
    'add_constraint / add_decision → create_card + link_to product or backend per placement rules.',
    'update_* with entity_id → update_card only; no create_card if card already on canvas.',
    'noop or empty operations → no canvas_ops; preview is md-only or unchanged canvas.',
  ],

  previewCardStyling: [
    'Card is preview when id is new or content changed vs committed (IntentCanvas diffPreview).',
    'Visual: canvas-node-card--preview — opacity ~55%, sky ring, solid border.',
    'Badge: sky "preview" pill next to card type label.',
    'Type colors unchanged — use existing cardTypeStyles per type.',
    'On commit: preview clears → full opacity; on discard: preview cards removed.',
  ],

  previewEdgeStyling: [
    'Edge is preview when id not in committed snapshot.',
    'Stroke: #60a5fa (sky-400); committed edges use #4b5563.',
    'strokeDasharray: 6 4 for preview; solid for committed (LabeledEdge.tsx).',
  ],

  mapperPipeline: [
    '1. Start from committed cards/edges clone.',
    '2. Apply canvas_ops in order (create → link → update).',
    '3. If canvas_ops empty, run deriveWhenEmpty from operations[] + writer entity ids.',
    '4. Auto-place new cards per canvasPlacementRules (preview-only).',
    '5. Merge writer mdPatches into PreviewPayload; summary from router plan.',
    '6. Return PreviewPayload — frontend diffPreview marks new ids as ghost.',
  ],

  examples: [
    {
      id: 'ex-gp03-add-feature',
      label: 'Add F-002 Google login (gp-03)',
      canvas_ops: [
        {
          action: 'create_card',
          type: 'feature',
          id: 'F-002',
          link_to: 'product',
          edge_label: 'contains',
        },
        {
          action: 'create_card',
          type: 'task',
          id: 'T-003',
          link_to: 'F-002',
          edge_label: 'implements',
        },
      ],
      notes: 'Router may emit ops after writers assign ids; mapper fills title/body from features.md / tasks.md sections.',
    },
    {
      id: 'ex-gp06-clarify',
      label: 'Clarify SSO domains (gp-06)',
      canvas_ops: [
        {
          action: 'create_card',
          type: 'open-question',
          id: 'OQ-002',
          link_to: 'features',
          edge_label: 'raises',
        },
      ],
      notes: 'Matches translatorStub local preview pattern: features → open-question.',
    },
    {
      id: 'ex-update-feature',
      label: 'Update F-001 pan/zoom (gp-01)',
      canvas_ops: [
        {
          action: 'update_card',
          id: 'F-001',
          status: 'in_progress',
        },
      ],
      notes: 'No create_card — match features card by specRef.anchor F-001 or id; position unchanged.',
    },
    {
      id: 'ex-empty-router-golden',
      label: 'Router golden (canvas_ops [])',
      canvas_ops: [],
      notes: 'Mapper derives from operations[] only — Phase 2 golden tests stay valid; placement runs on derived creates.',
    },
  ],

  explicitNonGoals: [
    'No router LLM change required for v0 — derivation covers empty canvas_ops.',
    'No split of aggregate features table card in mapper v0 — link_to features until per-F cards ship.',
    'No preview styling for mdPatches-only changes without canvas delta.',
    'No animated diff or highlight pulse — static ghost style only.',
  ],
}

/** Flatten brief for Agent mode or canvas mapper system prompt. */
export function formatCanvasOpsMapping(
  mapping: CanvasOpsMapping = CANVAS_OPS_MAPPING,
): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  const labelBlock = mapping.defaultEdgeLabels
    .map((row) => `- ${row.fromType} → ${row.toType}: "${row.label}"`)
    .join('\n')

  const exampleBlock = mapping.examples
    .map((ex) => {
      const ops = JSON.stringify(ex.canvas_ops, null, 2)
      return `### ${ex.label}\n\`\`\`json\n${ops}\n\`\`\`\n${ex.notes}`
    })
    .join('\n\n')

  return [
    '## Policy',
    mapping.policy,
    '',
    section('Allowed actions', mapping.allowedActions),
    '',
    section('create_card fields', mapping.createCardFields),
    '',
    section('link_to fields', mapping.linkToFields),
    '',
    section('update_card fields', mapping.updateCardFields),
    '',
    section('link_to aliases', mapping.linkToAliases),
    '',
    '## Default edge labels',
    labelBlock,
    '',
    section('Id conventions', mapping.idConventions),
    '',
    section('Derive when canvas_ops empty', mapping.deriveWhenEmpty),
    '',
    section('Preview card styling', mapping.previewCardStyling),
    '',
    section('Preview edge styling', mapping.previewEdgeStyling),
    '',
    section('Mapper pipeline', mapping.mapperPipeline),
    '',
    '## Examples',
    exampleBlock,
    '',
    section('Explicit non-goals', mapping.explicitNonGoals),
  ].join('\n')
}

export function getDefaultEdgeLabel(
  fromType: CanvasOpCardType | 'product',
  toType: CanvasOpCardType,
  mapping: CanvasOpsMapping = CANVAS_OPS_MAPPING,
): string | undefined {
  return mapping.defaultEdgeLabels.find(
    (row) => row.fromType === fromType && row.toType === toType,
  )?.label
}
